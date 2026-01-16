package models

import (
	"time"

	"gorm.io/gorm"
)

type SystemLog struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Level     string         `json:"level"` // INFO, WARN, ERROR, SUCCESS
	Message   string         `json:"message"`
	CreatedAt time.Time      `json:"created_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
