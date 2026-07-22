"""
Redis Manager API Routes
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
import subprocess
import shlex

redis_bp = Blueprint('redis_manager', __name__)


def run_redis_command(cmd):
    """Run redis-cli command."""
    try:
        args = ['redis-cli'] + shlex.split(cmd)
        result = subprocess.run(args, capture_output=True, text=True, timeout=10)
        return result.stdout.strip(), result.returncode
    except Exception as e:
        return str(e), 1


def is_redis_running():
    """Check if Redis is running."""
    out, code = run_redis_command("ping")
    return code == 0 and "PONG" in out


@redis_bp.route('/status', methods=['GET'])
@jwt_required()
def get_redis_status():
    """Get Redis server status."""
    if not is_redis_running():
        return jsonify({'running': False, 'message': 'Redis is not running'}), 200
    
    info = {}
    for section in ['server', 'memory', 'stats']:
        out, _ = run_redis_command(f"info {section}")
        for line in out.split('\n'):
            if ':' in line and not line.startswith('#'):
                key, val = line.split(':', 1)
                info[key.strip()] = val.strip()
    
    return jsonify({
        'running': True,
        'version': info.get('redis_version', 'unknown'),
        'uptime': info.get('uptime_in_seconds', '0'),
        'connected_clients': info.get('connected_clients', '0'),
        'used_memory': info.get('used_memory_human', '0B'),
        'max_memory': info.get('maxmemory_human', '0B'),
        'total_keys': info.get('db0', 'keys=0').split('=')[1].split(',')[0] if 'db0' in info else '0',
        'hits': info.get('keyspace_hits', '0'),
        'misses': info.get('keyspace_misses', '0'),
        'commands_processed': info.get('total_commands_processed', '0'),
    }), 200


@redis_bp.route('/keys', methods=['GET'])
@jwt_required()
def list_keys():
    """List Redis keys."""
    pattern = request.args.get('pattern', '*')
    out, code = run_redis_command(f"keys {pattern}")
    
    if code != 0:
        return jsonify({'error': 'Failed to list keys'}), 500
    
    keys = [k for k in out.split('\n') if k]
    key_info = []
    
    for key in keys[:100]:
        type_out, _ = run_redis_command(f"type {key}")
        ttl_out, _ = run_redis_command(f"ttl {key}")
        
        key_info.append({
            'key': key,
            'type': type_out,
            'ttl': int(ttl_out) if ttl_out.isdigit() else -1,
        })
    
    return jsonify({'keys': key_info, 'total': len(keys)}), 200


@redis_bp.route('/keys/<path:key>', methods=['GET'])
@jwt_required()
def get_key(key):
    """Get key value."""
    type_out, _ = run_redis_command(f"type {key}")
    
    if type_out == 'string':
        val_out, _ = run_redis_command(f"get {key}")
        return jsonify({'key': key, 'type': 'string', 'value': val_out}), 200
    elif type_out == 'list':
        val_out, _ = run_redis_command(f"lrange {key} 0 -1")
        return jsonify({'key': key, 'type': 'list', 'value': val_out}), 200
    elif type_out == 'set':
        val_out, _ = run_redis_command(f"smembers {key}")
        return jsonify({'key': key, 'type': 'set', 'value': val_out}), 200
    elif type_out == 'hash':
        val_out, _ = run_redis_command(f"hgetall {key}")
        return jsonify({'key': key, 'type': 'hash', 'value': val_out}), 200
    else:
        return jsonify({'key': key, 'type': type_out}), 200


@redis_bp.route('/keys/<path:key>', methods=['DELETE'])
@jwt_required()
def delete_key(key):
    """Delete a key."""
    out, code = run_redis_command(f"del {key}")
    if code != 0:
        return jsonify({'error': 'Failed to delete key'}), 500
    return jsonify({'message': f'Key {key} deleted'}), 200


@redis_bp.route('/command', methods=['POST'])
@jwt_required()
def run_command():
    """Run Redis command."""
    data = request.get_json()
    if not data or 'command' not in data:
        return jsonify({'error': 'command is required'}), 400
    
    command = data['command']
    dangerous = ['flushall', 'flushdb', 'shutdown', 'debug']
    if any(d in command.lower() for d in dangerous):
        return jsonify({'error': 'Command not allowed'}), 403
    
    out, code = run_redis_command(command)
    return jsonify({'output': out, 'exit_code': code}), 200


@redis_bp.route('/config', methods=['GET'])
@jwt_required()
def get_config():
    """Get Redis configuration."""
    out, _ = run_redis_command("config get *")
    
    config = {}
    lines = out.split('\n')
    for i in range(0, len(lines) - 1, 2):
        key = lines[i].strip()
        val = lines[i + 1].strip() if i + 1 < len(lines) else ''
        if key:
            config[key] = val
    
    return jsonify({'config': config}), 200


@redis_bp.route('/slowlog', methods=['GET'])
@jwt_required()
def get_slowlog():
    """Get slow log entries."""
    count = request.args.get('count', '10')
    out, _ = run_redis_command(f"slowlog get {count}")
    
    entries = []
    current_entry = {}
    
    for line in out.split('\n'):
        if line.startswith('1)') or line.startswith('2)') or line.startswith('3)'):
            if current_entry:
                entries.append(current_entry)
            current_entry = {}
        elif 'integer' in line:
            current_entry['id'] = line.split()[-1]
        elif 'microseconds' in line:
            current_entry['time'] = line.split(':')[-1].strip()
        elif 'command' in line:
            current_entry['command'] = line.split(':', 1)[-1].strip()
    
    if current_entry:
        entries.append(current_entry)
    
    return jsonify({'entries': entries}), 200
