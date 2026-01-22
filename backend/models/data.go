package models

import (
	"time"
)

type Thread struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	SiteID    uint      `gorm:"index;not null" json:"site_id"`
	StatsID   uint      `gorm:"index;not null" json:"stats_id"` // Hangi taramaya ait olduğu
	Title     string    `json:"title"`
	Link      string    `json:"link"`
	Author    string    `json:"author"`
	Date      string    `json:"date"`
	Category  string    `json:"category"` // Otomatik belirlenen kategori
	Posts     []Post    `json:"posts" gorm:"foreignKey:ThreadID;constraint:OnDelete:CASCADE;"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Post struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	ThreadID   uint      `gorm:"index;not null" json:"thread_id"`
	Author     string    `json:"author"`
	Content    string    `json:"content"`
	Date       string    `json:"date"`
	Order      int       `json:"order"`       // İleti sırası
	LastEdited string    `json:"last_edited"` // Düzenleme tarihi/bilgisi
	CreatedAt  time.Time `json:"created_at"`
}
