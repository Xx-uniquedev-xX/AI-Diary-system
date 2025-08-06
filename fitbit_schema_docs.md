# Fitbit Integration Schema Documentation

## Overview
Comprehensive Fitbit API integration for Pixel Watch 3 automatic tracking. All tables capture data automatically tracked by the device - no manual logging required.

## Fitbit Data Tables

### Heart Rate Monitoring (`fb_heart_rate_intraday`)
**Purpose**: Continuous heart rate tracking throughout the day
- `fb_hr_bpm` - Heart rate in beats per minute
- `fb_hr_confidence` - Measurement confidence (high/medium/low)
- `fb_hr_zone` - Heart rate zone (out_of_range, fat_burn, cardio, peak)
- `fb_hr_resting_rate` - Daily resting heart rate
- `fb_hr_variability` - Heart rate variability (HRV) in milliseconds

**Data Frequency**: Every minute during active periods
**ADHD Correlation**: Heart rate patterns can indicate stress, focus states, and medication effects

### Sleep Tracking (`fb_sleep_sessions`)
**Purpose**: Comprehensive sleep analysis and quality metrics
- `fb_sleep_start_time`, `fb_sleep_end_time` - Sleep period boundaries
- `fb_sleep_duration` - Total sleep duration in minutes
- `fb_sleep_efficiency` - Sleep efficiency percentage
- `fb_sleep_score` - Overall sleep score (0-100)
- `fb_sleep_deep_minutes` - Deep sleep duration
- `fb_sleep_light_minutes` - Light sleep duration
- `fb_sleep_rem_minutes` - REM sleep duration
- `fb_sleep_awakenings_count` - Number of sleep interruptions

**Data Frequency**: Daily sleep sessions
**ADHD Correlation**: Sleep quality directly impacts ADHD symptoms, focus, and emotional regulation

### Activity Tracking (`fb_activity_intraday`)
**Purpose**: Minute-by-minute movement and activity data
- `fb_act_steps` - Steps taken
- `fb_act_distance` - Distance covered in kilometers
- `fb_act_calories_burned` - Calories burned
- `fb_act_active_minutes` - Minutes of active movement
- `fb_act_sedentary_minutes` - Minutes of sedentary behavior
- `fb_act_floors_climbed` - Floors climbed
- `fb_act_elevation_gain` - Elevation gain in meters

**Data Frequency**: Every minute
**ADHD Correlation**: Physical activity levels affect focus, mood, and hyperactivity symptoms

### Daily Summary (`fb_daily_summary`)
**Purpose**: Aggregated daily health and activity metrics
- `fb_daily_steps` - Total daily steps
- `fb_daily_distance` - Total daily distance
- `fb_daily_calories_burned` - Total daily calories
- `fb_daily_resting_hr` - Daily resting heart rate
- `fb_daily_avg_hr` - Average heart rate for the day
- `fb_daily_max_hr` - Maximum heart rate reached
- `fb_daily_cardio_minutes` - Minutes in cardio zone
- `fb_daily_peak_minutes` - Minutes in peak zone

**Data Frequency**: Daily aggregation
**ADHD Correlation**: Daily patterns help identify optimal activity levels for symptom management

### Stress Management (`fb_stress_management`)
**Purpose**: Stress tracking and breathing exercise monitoring
- `fb_stress_score` - Daily stress management score (0-100)
- `fb_stress_responsive_sessions` - Number of guided breathing sessions
- `fb_stress_responsive_minutes` - Total minutes of breathing exercises
- `fb_stress_hrv_rmssd` - Heart rate variability measurement
- `fb_stress_recovery_time` - Time to recover from stress events

**Data Frequency**: Daily with real-time stress detection
**ADHD Correlation**: Stress levels directly impact ADHD symptoms and emotional regulation

### Blood Oxygen (`fb_spo2_data`)
**Purpose**: Blood oxygen saturation monitoring
- `fb_spo2_avg` - Average SpO2 percentage
- `fb_spo2_min` - Minimum SpO2 percentage
- `fb_spo2_max` - Maximum SpO2 percentage

**Data Frequency**: Periodic throughout day and during sleep
**ADHD Correlation**: Oxygen levels can affect cognitive function and focus

### Skin Temperature (`fb_skin_temperature`)
**Purpose**: Body temperature variation tracking
- `fb_temp_relative_change` - Relative temperature change in Celsius
- `fb_temp_logtype` - Tracking type (auto for automatic)

**Data Frequency**: Continuous monitoring
**ADHD Correlation**: Temperature variations can indicate stress responses and circadian rhythm patterns

### Breathing Rate (`fb_breathing_rate`)
**Purpose**: Respiratory rate monitoring during sleep
- `fb_breathing_rate` - Overall breathing rate (breaths per minute)
- `fb_breathing_deep_sleep` - Breathing rate during deep sleep
- `fb_breathing_rem_sleep` - Breathing rate during REM sleep
- `fb_breathing_light_sleep` - Breathing rate during light sleep

**Data Frequency**: During sleep periods
**ADHD Correlation**: Breathing patterns can indicate sleep quality and stress levels

### Cardio Fitness (`fb_cardio_fitness`)
**Purpose**: Cardiovascular fitness and VO2 Max tracking
- `fb_cardio_score` - Cardio fitness score (VO2 Max)
- `fb_cardio_range` - Fitness category (poor, fair, average, good, excellent)

**Data Frequency**: Weekly/monthly assessments
**ADHD Correlation**: Cardiovascular fitness affects cognitive function and symptom severity

### Active Zone Minutes (`fb_active_zone_minutes`)
**Purpose**: Time spent in different heart rate zones
- `fb_azm_total` - Total active zone minutes
- `fb_azm_fat_burn` - Fat burn zone minutes
- `fb_azm_cardio` - Cardio zone minutes
- `fb_azm_peak` - Peak zone minutes

**Data Frequency**: Daily aggregation
**ADHD Correlation**: Optimal heart rate zones for ADHD symptom management

## System Tables

### Device Status (`fb_device_status`)
**Purpose**: Monitor Pixel Watch 3 connectivity and battery
- `fb_device_battery_level` - Battery percentage
- `fb_device_last_sync` - Last successful sync timestamp
- `fb_device_type` - Device model (Pixel Watch 3)
- `fb_device_version` - Firmware version

**Data Frequency**: Every sync operation
**Purpose**: Ensure reliable data collection

### API Request Log (`fb_api_requests`)
**Purpose**: Track Fitbit API usage and rate limiting
- `fb_api_endpoint` - API endpoint called
- `fb_api_method` - HTTP method used
- `fb_api_status_code` - Response status code
- `fb_api_rate_limit_remaining` - Remaining API calls
- `fb_api_data_points_collected` - Number of data points retrieved

**Data Frequency**: Every API call
**Purpose**: Monitor API usage and prevent rate limit violations (150 requests/hour)

## ADHD-Specific Correlations

### Primary Correlations
1. **Sleep Quality → Focus Rating**: Poor sleep directly impacts next-day focus
2. **Heart Rate Variability → Stress Level**: HRV patterns predict stress episodes
3. **Activity Level → Mood Rating**: Physical activity correlates with mood stability
4. **Stress Score → Emotional Regulation**: High stress impairs emotional control

### Secondary Correlations
1. **Breathing Rate → Sleep Quality**: Irregular breathing affects sleep efficiency
2. **Cardio Fitness → Cognitive Performance**: Better fitness improves executive function
3. **Temperature Variations → Circadian Rhythm**: Temperature patterns indicate sleep-wake cycles
4. **Active Zone Minutes → Hyperactivity Management**: Optimal exercise zones for symptom control

## Data Collection Strategy

### Rate Limiting (150 requests/hour)
- **Heart Rate**: Every 15 minutes (96 requests/day)
- **Activity**: Every 15 minutes (96 requests/day)
- **Sleep**: Once daily (1 request/day)
- **Daily Summary**: Once daily (1 request/day)
- **Other metrics**: 2-3 times daily (6-9 requests/day)

**Total**: ~200 requests/day (well within 3,600/day limit)

### Data Retention
- **Intraday data**: 30 days for detailed analysis
- **Daily summaries**: Indefinite for long-term patterns
- **Sleep data**: Indefinite for sleep pattern analysis
- **API logs**: 90 days for debugging

### Sync Schedule
- **Real-time**: Heart rate, activity (when watch syncs)
- **Hourly**: Stress, temperature, breathing
- **Daily**: Sleep, daily summaries, fitness scores
- **Weekly**: Cardio fitness updates

## Security & Privacy

### Row Level Security
- All Fitbit tables have RLS enabled
- Users can only access their own data
- Policies enforce strict data isolation

### Data Encryption
- All physiological data encrypted at rest
- API tokens stored securely
- No sharing of personal health data

### Compliance
- HIPAA-compliant data handling
- User consent for all data collection
- Right to data deletion