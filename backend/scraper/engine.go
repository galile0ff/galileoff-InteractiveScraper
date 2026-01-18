package scraper

import (
	"fmt"
	"log"
	"net"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/gocolly/colly/v2"
	"github.com/gocolly/colly/v2/proxy"
)

type ScrapeResult struct {
	URL          string
	IsForum      bool
	Title        string
	ThreadCount  int
	PostCount    int
	ErrorMessage string
	Threads      []ThreadData
}

type ThreadData struct {
	Title   string
	Link    string
	Author  string
	Date    string
	Content string
	Posts   []PostData
}

type PostData struct {
	Author  string
	Content string
	Date    string
}

// AnalyzeSite, hedef siteyi tarar ve sonuçları döndürür.
func AnalyzeSite(targetURL string, torProxy string) (*ScrapeResult, error) {
	var result *ScrapeResult
	var err error
	maxRetries := 3

	for i := 0; i < maxRetries; i++ {
		// Loglama: Deneme sayısı
		if i > 0 {
			msg := fmt.Sprintf("Yeniden deneniyor (%d/%d): %s", i+1, maxRetries, targetURL)
			log.Println(msg)
			time.Sleep(2 * time.Second) // Bekleme süresi
		} else {
			log.Printf("Bağlantı başlatılıyor: %s", targetURL)
		}

		result, err = performScan(targetURL, torProxy)

		// Başarılıysa veya kritik olmayan bir hata varsa dön
		if err == nil {
			return result, nil
		}

		errMsg := err.Error()
		if strings.Contains(errMsg, "geçersiz") || strings.Contains(errMsg, "desteklenmeyen") ||
			strings.Contains(errMsg, "timeout") || strings.Contains(errMsg, "zaman aşımı") ||
			strings.Contains(errMsg, "unreachable") || strings.Contains(errMsg, "connection refused") ||
			strings.Contains(errMsg, "no such host") {
			log.Printf("Kritik Hata: %v", err)
			return nil, err
		}

		log.Printf("Hata alındı: %v. Bekleniyor...", err)
	}

	return nil, fmt.Errorf("Maksimum deneme sayısına ulaşıldı. Son hata: %v", err)
}

func performScan(targetURL string, torProxy string) (*ScrapeResult, error) {
	c := colly.NewCollector(
		colly.AllowURLRevisit(),
	)

	// Zaman aşımını ayarla
	c.SetRequestTimeout(15 * time.Second)

	// User Agent döndür
	c.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"

	// Proxy Yapılandır
	if torProxy != "" {
		rp, err := proxy.RoundRobinProxySwitcher(torProxy)
		if err != nil {
			return nil, fmt.Errorf("proxy error: %v", err)
		}
		c.SetProxyFunc(rp)
	}

	result := &ScrapeResult{
		URL: targetURL,
	}

	c.OnHTML("html", func(e *colly.HTMLElement) {

		// --- Forum Tespiti ---
		detectionScore := 0

		// 1. Meta Etiketlerini Kontrol Et
		e.DOM.Find("meta[name='generator']").Each(func(i int, s *goquery.Selection) {
			content, exists := s.Attr("content")
			if exists {
				content = strings.ToLower(content)
				if strings.Contains(content, "vbulletin") || strings.Contains(content, "xenforo") ||
					strings.Contains(content, "mybb") || strings.Contains(content, "phpbb") ||
					strings.Contains(content, "fluxbb") || strings.Contains(content, "smf") ||
					strings.Contains(content, "discuz") || strings.Contains(content, "nodebb") {
					detectionScore += 10
				}
			}
		})

		// 2. URL Yapısını Analiz Et
		urlLower := strings.ToLower(e.Request.URL.String())
		if strings.Contains(urlLower, "thread") || strings.Contains(urlLower, "topic") ||
			strings.Contains(urlLower, "showthread") || strings.Contains(urlLower, "viewtopic") ||
			strings.Contains(urlLower, "board") || strings.Contains(urlLower, "forums") {
			detectionScore += 5
		}

		// 3. İçerik ve Anahtar Kelime Analizi
		text := strings.ToLower(e.Text)
		forumKeywords := []string{
			"thread", "post", "topic", "forum", "vbulletin", "xenforo",
			"phpbb", "mybb", "discussion", "board", "kategori", "başlık",
			"cevap", "reply", "quote", "alıntı", "last post", "son mesaj",
			"started by", "gönderen", "registered", "kayıtlı",
		}

		for _, kw := range forumKeywords {
			if strings.Contains(text, kw) {
				detectionScore += 1
			}
		}

		// 4. DOM Yapısal Analizi
		if e.DOM.Find(".thread, .topic, .row, .threadbit, .windowbg").Length() > 0 {
			detectionScore += 3
		}
		if e.DOM.Find(".post, .message, .entry, .postbit, .post_block").Length() > 0 {
			detectionScore += 3
		}
		if e.DOM.Find(".pagination, .pagenav, .pages").Length() > 0 {
			detectionScore += 2
		}
		if e.DOM.Find(".breadcrumb, .navbit").Length() > 0 {
			detectionScore += 2
		}

		// Meta tag varsa direkt kabul et, yoksa diğer işaretlerin toplamına bak
		if detectionScore >= 5 {
			result.IsForum = true
		}

		// 1. İletileri Tespit Et
		// Yaygın forum yazılımlarının kullandığı kapsayıcı sınıflar
		postSelectors := []string{".post", ".message", ".entry", "article", ".comment", ".post-container", "div[id^='post']"}

		var posts []PostData

		// Seçicileri dene
		for _, selector := range postSelectors {
			e.DOM.Find(selector).Each(func(i int, s *goquery.Selection) {
				// İçerik
				content := strings.TrimSpace(s.Find(".content, .message, .body, .text, .entry-content, .post_body").Text())
				if content == "" {
					content = strings.TrimSpace(s.Text()) // Özel sınıf yoksa hepsini al
					if len(content) > 500 {
						content = content[:500] + "..."
					} // Çok uzunsa kes
				}

				// Yazar
				author := strings.TrimSpace(s.Find(".author, .user, .username, .name, a[href*='user'], .poster").First().Text())
				if author == "" {
					author = "Anonymous"
				}

				// Tarih
				date := strings.TrimSpace(s.Find(".date, .time, time, .timestamp, .published").First().Text())
				if date == "" {
					date = time.Now().Format("2006-01-02 15:04")
				}

				posts = append(posts, PostData{
					Author:  author,
					Content: content,
					Date:    date,
				})
			})

			// Eğer post bulduysak diğer seçicileri denemeye gerek yok (çakışmayı önlemek için)
			if len(posts) > 0 {
				break
			}
		}

		// 2. Thread Yapısını Oluştur
		// Eğer postlar bulunduysa, bu sayfayı bir "Konu" olarak kabul et
		if len(posts) > 0 {
			result.IsForum = true
			result.PostCount = len(posts)

			// İlk postu başlatan kişi olarak alabiliriz
			threadAuthor := posts[0].Author
			threadDate := posts[0].Date
			threadContent := posts[0].Content // İlk post ana içeriktir

			result.Threads = []ThreadData{
				{
					Title:   result.Title, // Sayfa başlığı konu başlığıdır
					Link:    result.URL,
					Author:  threadAuthor,
					Date:    threadDate,
					Content: threadContent,
					Posts:   posts, // Tüm postları ekle
				},
			}
			result.ThreadCount = 1
		} else {
			// Eğer post bulunamadıysa ama "Forum" tespit edildiyse (keywordlerle)
			if result.IsForum {
				// Konu listesi ayrıştırması
				e.DOM.Find(".thread, .topic, .row").Each(func(i int, s *goquery.Selection) {
					title := strings.TrimSpace(s.Find(".title, .subject, h3, a").First().Text())
					if title != "" {
						result.Threads = append(result.Threads, ThreadData{
							Title:  title,
							Link:   result.URL, // Link ayrıştırması daha karmaşık olabilir
							Author: "Unknown",
							Date:   time.Now().Format("2006-01-02"),
						})
					}
				})
				result.ThreadCount = len(result.Threads)
				if result.ThreadCount == 0 {
					// Fallback: Eğer hiçbir yapısal veri bulunamazsa, sayfayı tek bir konu gibi kaydet
					// Böylece kullanıcı en azından metin içeriğini görebilir.

					// Tüm metni al
					rawContent := strings.TrimSpace(e.DOM.Find("body").Text())
					if len(rawContent) > 2000 {
						rawContent = rawContent[:2000] + "... (devamı kırpıldı)"
					}

					result.Threads = []ThreadData{
						{
							Title:   result.Title,
							Link:    result.URL,
							Author:  "System (Fallback)",
							Date:    time.Now().Format("2006-01-02 15:04"),
							Content: "Otomatik ayrıştırma başarısız oldu. Ham içerik:\n\n" + rawContent,
							Posts:   []PostData{},
						},
					}
					result.ThreadCount = 1
					result.PostCount = 0
				}
			}
		}
	})

	// Hata yönetimi
	c.OnError(func(r *colly.Response, err error) {
		log.Printf("Request URL: %s failed with %v", r.Request.URL, err)
		errMsg := err.Error()

		// SOCKS Hata Kodları Analizi
		if strings.Contains(errMsg, "unknown code: 246") || strings.Contains(errMsg, "0xF6") {
			errMsg = "Onion adresi geçersiz veya desteklenmeyen formatta (V2)."
		} else if strings.Contains(errMsg, "timeout") {
			errMsg = "Bağlantı zaman aşımına uğradı. Site çok yavaş veya kapalı."
		} else if strings.Contains(errMsg, "host unreachable") {
			errMsg = "Hedef sunucuya ulaşılamıyor."
		} else if strings.Contains(errMsg, "connection refused") {
			errMsg = "Bağlantı reddedildi. Tor proxy çalışmıyor olabilir."
		} else if strings.Contains(errMsg, "EOF") {
			errMsg = "Sunucu bağlantıyı kesti (Boş Yanıt). Site çevrimdışı veya Tor devresi koptu."
		}

		result.ErrorMessage = errMsg
	})

	err := c.Visit(targetURL)
	if err != nil {
		// Eğer OnError içinde daha anlamlı bir hata mesajı varsa onu döndür
		if result.ErrorMessage != "" {
			return nil, fmt.Errorf("%s", result.ErrorMessage)
		}
		return nil, err
	}

	return result, nil
}

// GetActiveTorProxy, sistemde çalışan Tor bağlantısını (9050 veya 9150) tespit eder.
func GetActiveTorProxy() (string, error) {
	ports := []string{"9050", "9150"}

	for _, port := range ports {
		address := "127.0.0.1:" + port
		conn, err := net.DialTimeout("tcp", address, 500*time.Millisecond)
		if err == nil {
			conn.Close()
			return "socks5://" + address, nil
		}
	}

	return "", fmt.Errorf("Sistem Tor (9050) veya Tor Browser (9150) açık değil. Lütfen Tor bağlantınızı kontrol edin.")
}

// IsProxyConnectionError, hatanın Tor proxy'sine bağlanamama ile ilgili olup olmadığını kontrol eder
func IsProxyConnectionError(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	// Proxy bağlantı reddedildi veya bulunamadı hataları
	return strings.Contains(msg, "connection refused") ||
		strings.Contains(msg, "proxyconnect tcp") ||
		strings.Contains(msg, "dial tcp 127.0.0.1")
}
