package models

import (
	"time"

	"gorm.io/gorm"
)

type Site struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	URL       string         `gorm:"uniqueIndex;not null" json:"url"`
	IsForum   bool           `json:"is_forum"`
	LastScan  time.Time      `json:"last_scan"`
	Threads   []Thread       `json:"threads" gorm:"foreignKey:SiteID"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type Stats struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	SiteID       uint      `gorm:"index" json:"site_id"`
	Site         Site      `json:"site" gorm:"foreignKey:SiteID"`
	TotalThreads int       `json:"total_threads"`
	TotalPosts   int       `json:"total_posts"`
	ScanDate     time.Time `json:"scan_date"`
}
