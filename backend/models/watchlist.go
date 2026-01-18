package models

import (
	"time"

	"gorm.io/gorm"
)

type Watchlist struct {
	ID              uint           `gorm:"primaryKey" json:"id"`
	URL             string         `gorm:"not null" json:"url"`
	IntervalMinutes int            `gorm:"not null;default:60" json:"interval_minutes"` // Kontrol sıklığı (dakika)
	Description     string         `json:"description"`                                 // Opsiyonel açıklama
	LastChecked     *time.Time     `json:"last_checked"`                                // Son kontrol zamanı
	NextCheck       *time.Time     `json:"next_check"`                                  // Bir sonraki kontrol zamanı
	IsActive        bool           `gorm:"default:true" json:"is_active"`               // Aktif/pasif durumu
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
}
