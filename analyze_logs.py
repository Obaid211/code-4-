#!/usr/bin/env python3
"""
Log Analysis Tool for SmartAgri AI
Quick tool to analyze and summarize application logs
"""

import json
import os
from datetime import datetime
from collections import Counter

def analyze_predictions():
    """Analyze prediction logs"""
    print("\n" + "="*60)
    print("📊 PREDICTION ANALYSIS")
    print("="*60)
    
    try:
        with open('logs/predictions.log', 'r') as f:
            lines = f.readlines()
        
        if not lines:
            print("No predictions logged yet.")
            return
        
        print(f"\nTotal predictions: {len(lines)}")
        
        # Parse all predictions
        crop_recs = []
        plant_analyses = []
        chats = []
        tts_calls = []
        stt_calls = []
        
        for line in lines:
            try:
                entry = json.loads(line.strip())
                pred_type = entry.get('type')
                
                if pred_type == 'crop_recommendation':
                    crop_recs.append(entry)
                elif pred_type == 'plant_analysis':
                    plant_analyses.append(entry)
                elif pred_type == 'chat':
                    chats.append(entry)
                elif pred_type == 'tts':
                    tts_calls.append(entry)
                elif pred_type == 'stt':
                    stt_calls.append(entry)
            except json.JSONDecodeError:
                continue
        
        # Crop recommendations
        if crop_recs:
            print(f"\n🌾 Crop Recommendations: {len(crop_recs)}")
            crops = [entry['output'].get('top_crop') for entry in crop_recs if entry.get('output')]
            crop_counts = Counter(crops)
            print("  Top 5 recommended crops:")
            for crop, count in crop_counts.most_common(5):
                pct = (count / len(crop_recs)) * 100
                print(f"    • {crop}: {count} times ({pct:.1f}%)")
            
            # Average execution time
            exec_times = [entry['metadata'].get('execution_time_ms', 0) for entry in crop_recs if entry.get('metadata')]
            if exec_times:
                avg_time = sum(exec_times) / len(exec_times)
                print(f"  Average response time: {avg_time:.2f}ms")
        
        # Plant analyses
        if plant_analyses:
            print(f"\n🌿 Plant Health Analyses: {len(plant_analyses)}")
            healthy = sum(1 for entry in plant_analyses if entry.get('output', {}).get('is_healthy'))
            print(f"  Healthy plants: {healthy}/{len(plant_analyses)} ({(healthy/len(plant_analyses)*100):.1f}%)")
            
            diseases = sum(entry.get('output', {}).get('diseases_found', 0) for entry in plant_analyses)
            print(f"  Total diseases detected: {diseases}")
        
        # Chat interactions
        if chats:
            print(f"\n💬 Chat Interactions: {len(chats)}")
            langs = [entry['input'].get('lang') for entry in chats if entry.get('input')]
            lang_counts = Counter(langs)
            print("  Languages used:")
            for lang, count in lang_counts.most_common():
                print(f"    • {lang}: {count} times")
        
        # TTS and STT
        if tts_calls:
            print(f"\n🔊 Text-to-Speech: {len(tts_calls)} calls")
        if stt_calls:
            print(f"🎤 Speech-to-Text: {len(stt_calls)} calls")
        
    except FileNotFoundError:
        print("No prediction log file found.")
    except Exception as e:
        print(f"Error analyzing predictions: {e}")


def analyze_performance():
    """Analyze performance logs"""
    print("\n" + "="*60)
    print("⚡ PERFORMANCE ANALYSIS")
    print("="*60)
    
    try:
        with open('logs/performance.log', 'r') as f:
            lines = f.readlines()
        
        if not lines:
            print("No performance data logged yet.")
            return
        
        print(f"\nTotal requests: {len(lines)}")
        
        # Parse performance data
        endpoint_times = {}
        
        for line in lines:
            try:
                entry = json.loads(line.strip())
                endpoint = entry.get('endpoint', 'unknown')
                exec_time = entry.get('execution_time_ms', 0)
                
                if endpoint not in endpoint_times:
                    endpoint_times[endpoint] = []
                endpoint_times[endpoint].append(exec_time)
            except json.JSONDecodeError:
                continue
        
        # Calculate statistics per endpoint
        print("\nEndpoint Performance:")
        for endpoint, times in sorted(endpoint_times.items()):
            avg_time = sum(times) / len(times)
            min_time = min(times)
            max_time = max(times)
            
            print(f"\n  {endpoint}")
            print(f"    Calls: {len(times)}")
            print(f"    Avg: {avg_time:.2f}ms")
            print(f"    Min: {min_time:.2f}ms")
            print(f"    Max: {max_time:.2f}ms")
        
    except FileNotFoundError:
        print("No performance log file found.")
    except Exception as e:
        print(f"Error analyzing performance: {e}")


def analyze_api_calls():
    """Analyze external API calls"""
    print("\n" + "="*60)
    print("🔌 EXTERNAL API CALLS")
    print("="*60)
    
    try:
        with open('logs/api_calls.log', 'r') as f:
            lines = f.readlines()
        
        if not lines:
            print("No API calls logged yet.")
            return
        
        print(f"\nTotal API calls: {len(lines)}")
        
        api_stats = {}
        
        for line in lines:
            try:
                entry = json.loads(line.strip())
                api = entry.get('api', 'unknown')
                status = entry.get('status', 'unknown')
                exec_time = entry.get('execution_time_ms', 0)
                
                key = f"{api}_{status}"
                if key not in api_stats:
                    api_stats[key] = {'count': 0, 'times': []}
                
                api_stats[key]['count'] += 1
                api_stats[key]['times'].append(exec_time)
            except json.JSONDecodeError:
                continue
        
        print("\nAPI Call Summary:")
        for key, stats in sorted(api_stats.items()):
            avg_time = sum(stats['times']) / len(stats['times']) if stats['times'] else 0
            print(f"  {key}: {stats['count']} calls (avg {avg_time:.2f}ms)")
        
    except FileNotFoundError:
        print("No API call log file found.")
    except Exception as e:
        print(f"Error analyzing API calls: {e}")


def analyze_errors():
    """Analyze error logs"""
    print("\n" + "="*60)
    print("❌ ERROR ANALYSIS")
    print("="*60)
    
    try:
        with open('logs/errors.log', 'r') as f:
            lines = f.readlines()
        
        if not lines:
            print("\n✅ No errors logged - all systems operating normally!")
            return
        
        print(f"\nTotal errors: {len(lines)}")
        print("\nRecent errors (last 10):")
        
        for line in lines[-10:]:
            # Extract timestamp and error message
            parts = line.split('|')
            if len(parts) >= 4:
                timestamp = parts[0].strip()
                level = parts[2].strip()
                message = '|'.join(parts[4:]).strip()
                print(f"\n  [{timestamp}] {level}")
                print(f"    {message[:100]}...")
        
    except FileNotFoundError:
        print("\n✅ No error log file found - no errors logged!")
    except Exception as e:
        print(f"Error analyzing errors: {e}")


def show_recent_activity():
    """Show recent activity from app log"""
    print("\n" + "="*60)
    print("📝 RECENT ACTIVITY")
    print("="*60)
    
    try:
        with open('logs/app.log', 'r') as f:
            lines = f.readlines()
        
        if not lines:
            print("No activity logged yet.")
            return
        
        print("\nLast 15 log entries:")
        for line in lines[-15:]:
            parts = line.split('|')
            if len(parts) >= 3:
                timestamp = parts[0].strip()
                level = parts[2].strip()
                message = '|'.join(parts[4:]).strip() if len(parts) > 4 else ''
                
                # Color code by level
                if level == 'ERROR':
                    print(f"  ❌ [{timestamp}] {message}")
                elif level == 'WARNING':
                    print(f"  ⚠️  [{timestamp}] {message}")
                elif level == 'INFO':
                    print(f"  ℹ️  [{timestamp}] {message}")
                else:
                    print(f"  [{timestamp}] {message}")
        
    except FileNotFoundError:
        print("No app log file found.")
    except Exception as e:
        print(f"Error showing activity: {e}")


def main():
    """Main function"""
    print("\n" + "="*60)
    print("🌾 SMARTAGRI AI - LOG ANALYZER")
    print("="*60)
    
    if not os.path.exists('logs'):
        print("\n⚠️  No logs directory found. Run your application first!")
        return
    
    # Check which log files exist
    log_files = os.listdir('logs')
    print(f"\nFound {len(log_files)} log file(s)")
    
    # Run all analyses
    analyze_predictions()
    analyze_performance()
    analyze_api_calls()
    analyze_errors()
    show_recent_activity()
    
    print("\n" + "="*60)
    print("Analysis complete! 📊")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()