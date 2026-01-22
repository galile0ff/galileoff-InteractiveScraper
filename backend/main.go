package main

import (
	"log"
	"net/http"
	"os"
	"scraper/controllers"
	"scraper/models"
	"scraper/utils"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// Veritabanı Küresel Değişkeni
var DB *gorm.DB

func main() {
	// .env dosyasını yükle
	if err := godotenv.Load(); err != nil {
		log.Println("Uyarı: .env dosyası bulunamadı")
	}

	// Veritabanını Başlat
	initDB()

	// Uptime Başlat
	utils.InitStartTime()

	// Watchlist Scheduler Başlat
	go utils.StartWatchlistScheduler(DB)

	r := gin.Default()

	// CORS Ara Katmanı
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	api := r.Group("/api")
	{
		// --- Public Rotalar ---
		api.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"status": "ok"})
		})

		// Auth Controller
		authCtrl := controllers.NewAuthController(DB)
		api.POST("/login", authCtrl.Login)

		// --- Protected Rotalar ---
		protected := api.Group("/")
		protected.Use(utils.AuthMiddleware())
		{
			// Controller Örnekleri
			scanCtrl := controllers.NewScanController(DB)
			statsCtrl := controllers.NewStatsController(DB)
			historyCtrl := controllers.NewHistoryController(DB)
			settingsCtrl := controllers.NewSettingsController(DB)

			// Tarama
			protected.POST("/scan", scanCtrl.ScanSite)

			// İstatistikler ve Loglar
			protected.GET("/stats/general", statsCtrl.GetGeneralStats)
			protected.GET("/logs", statsCtrl.GetSystemLogs)
			protected.GET("/logs/stats", statsCtrl.GetLogStats)

			// Geçmiş
			protected.GET("/history", historyCtrl.GetHistory)
			protected.GET("/history/:id", historyCtrl.GetScanDetails)

			// Sistem İşlemleri
			protected.POST("/system/reset-db", settingsCtrl.ResetDatabase)

			// Ayarlar (Keywords)
			protected.GET("/settings/keywords", settingsCtrl.GetKeywords)
			protected.POST("/settings/keywords", settingsCtrl.AddKeyword)
			protected.PUT("/settings/keywords/:id", settingsCtrl.UpdateKeyword)
			protected.DELETE("/settings/keywords/:id", settingsCtrl.DeleteKeyword)

			// Ayarlar (User Agents)
			protected.GET("/settings/user-agents", settingsCtrl.GetUserAgents)
			protected.POST("/settings/user-agents", settingsCtrl.AddUserAgent)
			protected.PUT("/settings/user-agents/:id", settingsCtrl.UpdateUserAgent)
			protected.DELETE("/settings/user-agents/:id", settingsCtrl.DeleteUserAgent)

			// Ayarlar (Watchlist)
			protected.GET("/settings/watchlist", settingsCtrl.GetWatchlist)
			protected.POST("/settings/watchlist", settingsCtrl.AddWatchlistItem)
			protected.PUT("/settings/watchlist/toggle-all", settingsCtrl.ToggleAllWatchlist)
			protected.PUT("/settings/watchlist/:id", settingsCtrl.UpdateWatchlistItem)
			protected.DELETE("/settings/watchlist/:id", settingsCtrl.DeleteWatchlistItem)
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Sunucu %s portunda başlatılıyor", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Sunucu başlatılamadı: ", err)
	}
}

func initDB() {
	// Veri dizini yoksa oluştur
	if _, err := os.Stat("data"); os.IsNotExist(err) {
		os.Mkdir("data", 0755)
	}

	dbPath := "data/scraper.db"
	if envPath := os.Getenv("DB_PATH"); envPath != "" {
		dbPath = envPath
	}

	var err error
	DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		log.Fatalf("Veritabanı bağlantısı başarısız: %v", err)
	}

	// Otomatik Taşıma
	err = DB.AutoMigrate(&models.Site{}, &models.Stats{}, &models.User{}, &models.SystemLog{}, &models.Thread{}, &models.Post{}, &models.Keyword{}, &models.UserAgent{}, &models.Watchlist{})
	if err != nil {
		log.Printf("Taşıma başarısız: %v", err)
	} else {
		log.Println("Veritabanı bağlandı ve taşındı.")
	}

	seedUsers()
}

func seedUsers() {
	var count int64
	DB.Model(&models.User{}).Count(&count)
	if count == 0 {
		passwordHash, _ := bcrypt.GenerateFromPassword([]byte("galileoff"), bcrypt.DefaultCost)
		user := models.User{
			Username: "admin",
			Password: string(passwordHash),
		}
		DB.Create(&user)
		log.Println("Admin kullanıcısı oluşturuldu.")
	}
}
