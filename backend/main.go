package main

import (
	"log"
	"net/http"
	"os"
	"scraper/controllers"
	"scraper/models"

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

	r := gin.Default()

	// CORS Ara Katmanı
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	api := r.Group("/api")
	{
		api.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"status": "ok"})
		})

		// Tarayıcı uç noktaları
		scanCtrl := controllers.NewScanController(DB)
		authCtrl := controllers.NewAuthController(DB)

		api.POST("/scan", scanCtrl.ScanSite)
		api.POST("/login", authCtrl.Login)
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
	err = DB.AutoMigrate(&models.Site{}, &models.Page{}, &models.Stats{}, &models.User{})
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
