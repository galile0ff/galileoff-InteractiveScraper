package utils

import "time"

var StartTime time.Time

func InitStartTime() {
	StartTime = time.Now()
}

func GetUptime() time.Duration {
	return time.Since(StartTime)
}
