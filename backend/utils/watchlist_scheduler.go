package utils

import (
	"fmt"
	"log"
	"os"
	"scraper/models"
	"scraper/scraper"
	"time"

	"gorm.io/gorm"
)

// WatchlistScheduler: Watchlist'teki siteleri düzenli aralıklarla kontrol eder ve tarar
func StartWatchlistScheduler(db *gorm.DB) {
	ticker := time.NewTicker(1 * time.Minute) // Her dakika kontrol et
	defer ticker.Stop()

	log.Println("Watchlist scheduler başlatıldı - her dakika kontrol edilecek")

	for range ticker.C {
		// Watchlist aktif mi kontrol et
		var watchlist []models.Watchlist
		now := time.Now()

		// Zamanı gelen ve aktif olan watchlist öğelerini getir
		db.Where("is_active = ? AND (next_check IS NULL OR next_check <= ?)", true, now).Find(&watchlist)

		if len(watchlist) == 0 {
			continue
		}

		log.Printf("Watchlist: %d site taranacak", len(watchlist))

		for _, item := range watchlist {
			go processWatchlistItem(db, &item)
		}
	}
}

func processWatchlistItem(db *gorm.DB, item *models.Watchlist) {
	log.Printf("Watchlist taraması başlatılıyor: %s", item.URL)

	// Tor Proxy Hazırlığı
	torProxy := os.Getenv("TOR_PROXY")
	if torProxy == "" {
		activeProxy, err := scraper.GetActiveTorProxy()
		if err != nil {
			LogError(db, "WATCHLIST", fmt.Sprintf("Watchlist taraması başarısız (Tor proxy bulunamadı): %s", item.URL))
			return
		}
		torProxy = activeProxy
	}

	// Keywords getir
	var keywords []models.Keyword
	db.Find(&keywords)

	// User Agents getir
	var userAgents []string
	var uaList []models.UserAgent
	db.Find(&uaList)
	for _, ua := range uaList {
		userAgents = append(userAgents, ua.UserAgent)
	}

	// URL'i normalize et
	normalizedURL := scraper.NormalizeURL(item.URL)

	// Siteyi tara
	result, err := scraper.AnalyzeSite(normalizedURL, torProxy, keywords, userAgents)
	if err != nil {
		LogError(db, "WATCHLIST", fmt.Sprintf("Watchlist tarama hatası: %s - %v", item.URL, err))
		updateNextCheck(db, item)
		return
	}

	if result.ErrorMessage != "" {
		LogError(db, "WATCHLIST", fmt.Sprintf("Watchlist erişim hatası: %s - %s", item.URL, result.ErrorMessage))
		updateNextCheck(db, item)
		return
	}

	// Sadece forum ise kaydet
	if result.IsForum {
		saveWatchlistResult(db, result, item)
		LogSuccess(db, "WATCHLIST", fmt.Sprintf("Watchlist taraması tamamlandı: %s (%d thread, %d post)", item.URL, result.ThreadCount, result.PostCount))
	} else {
		LogWarn(db, "WATCHLIST", fmt.Sprintf("Watchlist sitesi forum değil: %s", item.URL))
	}

	// Bir sonraki kontrol zamanını güncelle
	updateNextCheck(db, item)
}

func saveWatchlistResult(db *gorm.DB, result *scraper.ScrapeResult, watchlistItem *models.Watchlist) {
	// Site kaydı oluştur veya güncelle
	site := models.Site{
		URL:      result.URL,
		LastScan: time.Now(),
	}
	db.Where(models.Site{URL: result.URL}).Assign(models.Site{
		LastScan: time.Now(),
	}).FirstOrCreate(&site)

	// Stats kaydı - watchlist olarak işaretle
	stats := models.Stats{
		SiteID:       site.ID,
		Source:       "watchlist", // Watchlistden geldiğini işaretle
		TotalThreads: result.ThreadCount,
		TotalPosts:   result.PostCount,
		ScanDate:     time.Now(),
	}
	db.Create(&stats)

	// Thread ve Post kayıtları (goroutine)
	go func(siteID, statsID uint, threads []scraper.ThreadData) {
		for _, t := range threads {
			thread := models.Thread{
				SiteID:   siteID,
				StatsID:  statsID,
				Title:    t.Title,
				Link:     t.Link,
				Author:   t.Author,
				Date:     t.Date,
				Category: t.Category,
			}
			db.Create(&thread)

			for i, p := range t.Posts {
				db.Create(&models.Post{
					ThreadID: thread.ID,
					Author:   p.Author,
					Content:  p.Content,
					Date:     p.Date,
					Order:    i + 1,
				})
			}
		}
	}(site.ID, stats.ID, result.Threads)

	// Watchlist itemin last_checkedinı güncelle
	now := time.Now()
	db.Model(watchlistItem).Updates(map[string]interface{}{
		"last_checked": &now,
	})
}

func updateNextCheck(db *gorm.DB, item *models.Watchlist) {
	nextCheck := time.Now().Add(time.Duration(item.IntervalMinutes) * time.Minute)
	db.Model(item).Update("next_check", &nextCheck)
}
