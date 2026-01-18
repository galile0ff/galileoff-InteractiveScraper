package models

import (
	"time"

	"gorm.io/gorm"
)

type Keyword struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Word      string         `gorm:"index;not null" json:"word"`
	Category  string         `json:"category"`
	Color     string         `json:"color"` // Etiket rengi
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
