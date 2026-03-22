"""
Comprehensive Logging System for SmartAgri AI
Handles app logs, API calls, predictions, errors, and performance monitoring
"""

import logging
import logging.handlers
import json
from datetime import datetime
from functools import wraps
import time
from pathlib import Path
import traceback

# ===========================
# 1. LOGGING CONFIGURATION
# ===========================

def setup_logging(app_name="smartagri"):
    """Initialize all loggers with proper handlers and formatters"""
    
    # Create logs directory
    Path("logs").mkdir(exist_ok=True)
    
    # Custom formatter with more context
    detailed_formatter = logging.Formatter(
        '%(asctime)s | %(name)s | %(levelname)s | %(funcName)s:%(lineno)d | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    json_formatter = logging.Formatter('%(message)s')
    
    # --- Application Logger (General app flow) ---
    app_logger = logging.getLogger(f'{app_name}.app')
    app_logger.setLevel(logging.INFO)
    app_logger.handlers.clear()  # Clear existing handlers
    
    app_handler = logging.handlers.RotatingFileHandler(
        'logs/app.log',
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    app_handler.setFormatter(detailed_formatter)
    app_logger.addHandler(app_handler)
    
    # Console handler for development
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(detailed_formatter)
    app_logger.addHandler(console_handler)
    
    # --- API Logger (External API calls) ---
    api_logger = logging.getLogger(f'{app_name}.api')
    api_logger.setLevel(logging.INFO)
    api_logger.handlers.clear()
    
    api_handler = logging.handlers.RotatingFileHandler(
        'logs/api_calls.log',
        maxBytes=10*1024*1024,
        backupCount=5
    )
    api_handler.setFormatter(json_formatter)
    api_logger.addHandler(api_handler)
    
    # --- Prediction/Analysis Logger ---
    pred_logger = logging.getLogger(f'{app_name}.predictions')
    pred_logger.setLevel(logging.INFO)
    pred_logger.handlers.clear()
    
    pred_handler = logging.handlers.RotatingFileHandler(
        'logs/predictions.log',
        maxBytes=10*1024*1024,
        backupCount=5
    )
    pred_handler.setFormatter(json_formatter)
    pred_logger.addHandler(pred_handler)
    
    # --- Error Logger ---
    error_logger = logging.getLogger(f'{app_name}.errors')
    error_logger.setLevel(logging.ERROR)
    error_logger.handlers.clear()
    
    error_handler = logging.handlers.RotatingFileHandler(
        'logs/errors.log',
        maxBytes=10*1024*1024,
        backupCount=5
    )
    error_handler.setFormatter(detailed_formatter)
    error_logger.addHandler(error_handler)
    
    # --- Performance Logger ---
    perf_logger = logging.getLogger(f'{app_name}.performance')
    perf_logger.setLevel(logging.INFO)
    perf_logger.handlers.clear()
    
    perf_handler = logging.handlers.RotatingFileHandler(
        'logs/performance.log',
        maxBytes=5*1024*1024,
        backupCount=3
    )
    perf_handler.setFormatter(json_formatter)
    perf_logger.addHandler(perf_handler)
    
    # --- User Activity Logger ---
    user_logger = logging.getLogger(f'{app_name}.users')
    user_logger.setLevel(logging.INFO)
    user_logger.handlers.clear()
    
    user_handler = logging.handlers.RotatingFileHandler(
        'logs/user_activity.log',
        maxBytes=10*1024*1024,
        backupCount=5
    )
    user_handler.setFormatter(json_formatter)
    user_logger.addHandler(user_handler)
    
    return app_logger, api_logger, pred_logger, error_logger, perf_logger, user_logger


# ===========================
# 2. LOGGING DECORATORS
# ===========================

def log_endpoint(endpoint_name):
    """Decorator to log API endpoint calls with timing"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            app_logger = logging.getLogger('smartagri.app')
            perf_logger = logging.getLogger('smartagri.performance')
            error_logger = logging.getLogger('smartagri.errors')
            
            request_id = datetime.now().strftime("%Y%m%d%H%M%S%f")
            start_time = time.time()
            
            app_logger.info(f"[{request_id}] {endpoint_name} - Request received")
            
            try:
                result = func(*args, **kwargs)
                
                execution_time = round((time.time() - start_time) * 1000, 2)
                
                # Log performance
                perf_data = {
                    "request_id": request_id,
                    "timestamp": datetime.now().isoformat(),
                    "endpoint": endpoint_name,
                    "execution_time_ms": execution_time,
                    "status": "success"
                }
                perf_logger.info(json.dumps(perf_data))
                
                app_logger.info(f"[{request_id}] {endpoint_name} - Completed in {execution_time}ms")
                return result
                
            except Exception as e:
                execution_time = round((time.time() - start_time) * 1000, 2)
                error_logger.error(
                    f"[{request_id}] {endpoint_name} failed after {execution_time}ms: {str(e)}",
                    exc_info=True
                )
                
                # Log failed performance
                perf_data = {
                    "request_id": request_id,
                    "timestamp": datetime.now().isoformat(),
                    "endpoint": endpoint_name,
                    "execution_time_ms": execution_time,
                    "status": "error",
                    "error": str(e)
                }
                perf_logger.info(json.dumps(perf_data))
                raise
        
        return wrapper
    return decorator


def log_external_api_call(api_name):
    """Decorator to log external API calls"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            api_logger = logging.getLogger('smartagri.api')
            error_logger = logging.getLogger('smartagri.errors')
            
            call_id = datetime.now().strftime("%Y%m%d%H%M%S%f")
            start_time = time.time()
            
            try:
                result = func(*args, **kwargs)
                
                execution_time = round((time.time() - start_time) * 1000, 2)
                
                api_log = {
                    "call_id": call_id,
                    "timestamp": datetime.now().isoformat(),
                    "api": api_name,
                    "execution_time_ms": execution_time,
                    "status": "success"
                }
                api_logger.info(json.dumps(api_log))
                
                return result
                
            except Exception as e:
                execution_time = round((time.time() - start_time) * 1000, 2)
                
                api_log = {
                    "call_id": call_id,
                    "timestamp": datetime.now().isoformat(),
                    "api": api_name,
                    "execution_time_ms": execution_time,
                    "status": "error",
                    "error": str(e)
                }
                api_logger.info(json.dumps(api_log))
                error_logger.error(f"External API call to {api_name} failed: {str(e)}", exc_info=True)
                raise
        
        return wrapper
    return decorator


# ===========================
# 3. HELPER FUNCTIONS
# ===========================

def log_prediction(prediction_type, input_data, output_data, metadata=None):
    """Log a prediction/analysis result"""
    pred_logger = logging.getLogger('smartagri.predictions')
    
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "type": prediction_type,
        "input": input_data,
        "output": output_data,
        "metadata": metadata or {}
    }
    
    pred_logger.info(json.dumps(log_entry))


def log_user_activity(user_id, activity_type, details=None):
    """Log user activity"""
    user_logger = logging.getLogger('smartagri.users')
    
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "user_id": user_id,
        "activity": activity_type,
        "details": details or {}
    }
    
    user_logger.info(json.dumps(log_entry))


def log_error_with_context(error, context=None):
    """Log an error with additional context"""
    error_logger = logging.getLogger('smartagri.errors')
    
    error_msg = f"Error: {str(error)}"
    if context:
        error_msg += f" | Context: {json.dumps(context)}"
    
    error_logger.error(error_msg, exc_info=True)


# ===========================
# 4. LOG ANALYSIS UTILITIES
# ===========================

def analyze_logs(log_file, last_n=100):
    """Analyze recent log entries"""
    try:
        with open(f'logs/{log_file}', 'r') as f:
            lines = f.readlines()
        
        recent = lines[-last_n:]
        print(f"\n📊 Analysis of {log_file} (last {len(recent)} entries)")
        print("=" * 60)
        
        if log_file in ['predictions.log', 'api_calls.log', 'performance.log', 'user_activity.log']:
            # JSON logs
            data = []
            for line in recent:
                try:
                    data.append(json.loads(line.strip()))
                except json.JSONDecodeError:
                    continue
            
            if log_file == 'performance.log':
                avg_time = sum(d.get('execution_time_ms', 0) for d in data) / len(data) if data else 0
                print(f"Average response time: {avg_time:.2f}ms")
                
                endpoints = {}
                for d in data:
                    ep = d.get('endpoint', 'unknown')
                    endpoints[ep] = endpoints.get(ep, [])
                    endpoints[ep].append(d.get('execution_time_ms', 0))
                
                print("\nEndpoint performance:")
                for ep, times in sorted(endpoints.items()):
                    avg = sum(times) / len(times)
                    print(f"  {ep}: {avg:.2f}ms avg ({len(times)} calls)")
            
            elif log_file == 'predictions.log':
                types = {}
                for d in data:
                    t = d.get('type', 'unknown')
                    types[t] = types.get(t, 0) + 1
                
                print("Prediction types:")
                for t, count in sorted(types.items(), key=lambda x: x[1], reverse=True):
                    print(f"  {t}: {count} times")
            
            elif log_file == 'api_calls.log':
                apis = {}
                for d in data:
                    api = d.get('api', 'unknown')
                    status = d.get('status', 'unknown')
                    key = f"{api}_{status}"
                    apis[key] = apis.get(key, 0) + 1
                
                print("API call summary:")
                for key, count in sorted(apis.items(), key=lambda x: x[1], reverse=True):
                    print(f"  {key}: {count} calls")
        
        else:
            # Text logs
            print(f"Showing last 10 entries:\n")
            for line in recent[-10:]:
                print(line.strip())
    
    except FileNotFoundError:
        print(f"Log file logs/{log_file} not found")
    except Exception as e:
        print(f"Error analyzing logs: {e}")


def get_error_summary():
    """Get summary of recent errors"""
    try:
        with open('logs/errors.log', 'r') as f:
            lines = f.readlines()
        
        if not lines:
            print("✅ No errors logged")
            return
        
        print(f"\n❌ Total errors: {len(lines)}")
        print("\nRecent errors (last 5):")
        for line in lines[-5:]:
            print(f"  {line.strip()}")
    
    except FileNotFoundError:
        print("✅ No error log found")


# ===========================
# 5. INITIALIZATION
# ===========================

# Initialize loggers on import
app_logger, api_logger, pred_logger, error_logger, perf_logger, user_logger = setup_logging()

print("✅ Logging system initialized")
print("📁 Log files: logs/app.log, logs/api_calls.log, logs/predictions.log,")
print("              logs/errors.log, logs/performance.log, logs/user_activity.log")
