package models

import (
	"time"

	"gorm.io/gorm"
)

type Thread struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	SiteID    uint           `gorm:"index" json:"site_id"`
	StatsID   uint           `gorm:"index" json:"stats_id"` // Hangi taramaya ait olduğu
	Title     string         `json:"title"`
	Link      string         `json:"link"`
	Author    string         `json:"author"`
	Date      string         `json:"date"`
	Content   string         `json:"content"`  // Ana konu içeriği
	Category  string         `json:"category"` // Otomatik belirlenen kategori
	Posts     []Post         `json:"posts" gorm:"foreignKey:ThreadID"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type Post struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	ThreadID  uint           `gorm:"index" json:"thread_id"`
	Author    string         `json:"author"`
	Content   string         `json:"content"`
	Date      string         `json:"date"`
	Order     int            `json:"order"` // İleti sırası
	CreatedAt time.Time      `json:"created_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
