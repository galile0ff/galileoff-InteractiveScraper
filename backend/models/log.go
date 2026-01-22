package models

import (
	"time"
)

type SystemLog struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Level     string    `json:"level"` // INFO, WARN, ERROR, SUCCESS
	Source    string    `json:"source"`
	Message   string    `json:"message"`
	CreatedAt time.Time `json:"created_at"`
}
