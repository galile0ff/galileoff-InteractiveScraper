package models

import (
	"time"
)

type Site struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	URL       string    `gorm:"uniqueIndex;not null" json:"url"`
	LastScan  time.Time `json:"last_scan"`
	Threads   []Thread  `json:"threads" gorm:"foreignKey:SiteID;constraint:OnDelete:CASCADE;"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Stats struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	SiteID       uint      `gorm:"index" json:"site_id"`
	Site         Site      `json:"site" gorm:"foreignKey:SiteID"`
	Source       string    `gorm:"default:'manual'" json:"source"` // manual veya watchlist
	TotalThreads int       `json:"total_threads"`
	TotalPosts   int       `json:"total_posts"`
	ScanDate     time.Time `json:"scan_date"`
}
