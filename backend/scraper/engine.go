package scraper

import (
	"fmt"
	"log"
	"math/rand"
	"net"
	"strings"
	"time"

	"scraper/models"

	"github.com/PuerkitoBio/goquery"
	"github.com/gocolly/colly/v2"
	"github.com/gocolly/colly/v2/proxy"
)

type ScrapeResult struct {
	URL          string       `json:"url"`
	IsForum      bool         `json:"is_forum"`
	Title        string       `json:"title"`
	ThreadCount  int          `json:"thread_count"`
	PostCount    int          `json:"post_count"`
	ErrorMessage string       `json:"error_message"`
	Threads      []ThreadData `json:"threads"`
	UserAgent    string       `json:"user_agent"`
}

type ThreadData struct {
	Title    string     `json:"title"`
	Link     string     `json:"link"`
	Author   string     `json:"author"`
	Date     string     `json:"date"`
	Content  string     `json:"content"`
	Category string     `json:"category"` // Tespit edilen kategori
	Posts    []PostData `json:"posts"`
}

type PostData struct {
	Author     string `json:"author"`
	Content    string `json:"content"`
	Date       string `json:"date"`
	Reactions  string `json:"reactions"`
	LastEdited string `json:"last_edited"`
}

// AnalyzeSite, hedef siteyi tarar ve sonuçları döndürür.
func AnalyzeSite(targetURL string, torProxy string, keywords []models.Keyword, userAgents []string) (*ScrapeResult, error) {
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

		result, err = performScan(targetURL, torProxy, keywords, userAgents)

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

func performScan(targetURL string, torProxy string, keywords []models.Keyword, userAgents []string) (*ScrapeResult, error) {
	c := colly.NewCollector(
		colly.AllowURLRevisit(),
	)

	// Zaman aşımını ayarla
	c.SetRequestTimeout(15 * time.Second)

	// User Agent Ayarla
	c.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"

	if len(userAgents) > 0 {
		rand.Seed(time.Now().UnixNano())
		c.UserAgent = userAgents[rand.Intn(len(userAgents))]
		log.Printf("Random UA Seçildi: %s", c.UserAgent)
	}

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

	// Başlık Çekme
	c.OnHTML("title", func(e *colly.HTMLElement) {
		if result.Title == "" {
			result.Title = strings.TrimSpace(e.Text)
		}
	})

	c.OnHTML("h1", func(e *colly.HTMLElement) {
		// h1 varsa öncelik ver veya title boşsa doldur
		h1 := strings.TrimSpace(e.Text)
		if h1 != "" {
			result.Title = h1
		}
	})

	c.OnHTML(".p-title-value, .ipbType_sectionTitle", func(e *colly.HTMLElement) {
		// Forum özel başlık sınıfları
		title := strings.TrimSpace(e.Text)
		if title != "" {
			result.Title = title
		}
	})

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
		var posts []PostData

		// Yaygın forum yazılımlarının kullandığı kapsayıcı sınıflar
		postSelectors := []string{
			".post", ".message", ".entry", "article", ".comment", ".post-container", "div[id^='post']",
			".postbit", ".post-content", ".message-content", ".post_body", ".entry-content",
			".ItemBody", ".CommentBody", ".lia-message-body-content", ".js-post__content-text",
			".cooked", ".topic-body", ".post-message", ".post_wrapper", ".post_block",
			"table.post", "div.post", "td.post_content",
		}

		// Seçicileri dene
		for _, selector := range postSelectors {
			e.DOM.Find(selector).Each(func(i int, s *goquery.Selection) {
				// --- Meta Verileri Çek ---

				// Meta Verileri Çek
				lastEdited := strings.TrimSpace(s.Find(".message-lastEdit, .post-edit, .edited-by").Text())
				lastEdited = strings.TrimSpace(strings.ReplaceAll(lastEdited, "\n", " "))

				// --- İçerik Temizliği ---

				// İçerik
				contentSel := s.Find(".content, .message, .body, .text, .entry-content, .post_body, .post_content, .posttext, .post-text, .messageText, .uu_post")

				// Gereksiz etiketleri temizle
				contentSel.Find(`
					script, style, button, isindex,
					.footer, .signature, .kutu, 
					.message-cell--user, .message-userInfo, .post-sidebar, .postprofile, .user-details, .post-left, .user_info, .author_info,
					.message-userExtras, .message-avatar-wrapper, .message-userTitle, .message-userBanner,
					.bbCodeBlock-expandLink, .attribution,
					.reaction-bar, .reactions, .message-attribution, .message-footer, .message-lastEdit, .privateControls, .publicControls,
					.post_head, .post-head, .node-controls, .post-date, .date, .permalink, .post-number,
					dl.pairs
				`).Remove()

				// Metin temizliği
				content := strings.TrimSpace(contentSel.Text())
				content = strings.ReplaceAll(content, "Click to expand...", "")
				content = strings.ReplaceAll(content, "Tıkla ve genişlet...", "")

				// Eğer özel içerik seçicisi işe yaramazsa (veya yanlışlıkla her şeyi sildiyse) ana konteynerden al
				if content == "" {
					// Ana konteynerin textini al ama temizleyerek
					clone := s.Clone()
					// Buradaki remove listesi de aynı olmalı
					clone.Find(`
						script, style, button, 
						.footer, .signature, .user_info, .author_info, .post_head, .post-head,
						.message-cell--user, .message-userInfo, .postprofile,
						.message-attribution, .message-footer, .message-lastEdit, .reaction-bar
					`).Remove()

					content = strings.TrimSpace(clone.Text())
					content = strings.ReplaceAll(content, "Click to expand...", "")

					if len(content) > 2000 {
						content = content[:2000] + "..."
					}
				}

				// Çok kısa içerikleri yoksay (gürültü önleme)
				if len(content) < 3 {
					return
				}

				// Yazar
				author := strings.TrimSpace(s.Find(".author, .user, .username, .name, a[href*='user'], .poster, .user-details, .popupctrl, .mem_profile").First().Text())
				if author == "" {
					author = strings.TrimSpace(s.Find(".user_info, .author_info, .post_author").First().Text())
				}
				if author == "" {
					author = "Anonymous"
				}

				// Tarih
				date := strings.TrimSpace(s.Find(".date, .time, time, .timestamp, .published, .post-date, .date-header, .post_date").First().Text())
				if date == "" {
					// Başlık veya meta kısımlarında tarih arayalım
					date = strings.TrimSpace(s.Find(".post_head, .post-head, .thead").Text())
				}
				if date == "" {
					date = time.Now().Format("2006-01-02 15:04")
				}

				posts = append(posts, PostData{
					Author:     cleanText(author),
					Content:    cleanText(content), // Temizleme fonksiyonu kullan
					Date:       cleanText(date),
					Reactions:  "",
					LastEdited: lastEdited,
				})
			})

			// Eğer post bulduysak ve yeterli sayıdaysa (false pozitifleri önlemek için)
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
					Title:    result.Title, // Sayfa başlığı konu başlığıdır
					Link:     result.URL,
					Author:   threadAuthor,
					Date:     threadDate,
					Content:  threadContent,
					Category: detectCategory(threadContent+" "+result.Title, keywords),
					Posts:    posts, // Tüm postları ekle
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
							Title:    title,
							Link:     result.URL,
							Author:   "Unknown",
							Date:     time.Now().Format("2006-01-02"),
							Category: detectCategory(title, keywords),
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
							Title:    result.Title,
							Link:     result.URL,
							Author:   "System (Fallback)",
							Date:     time.Now().Format("2006-01-02 15:04"),
							Content:  "Otomatik ayrıştırma başarısız oldu. Ham içerik:\n\n" + rawContent,
							Category: detectCategory(result.Title, keywords),
							Posts:    []PostData{},
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

	result.UserAgent = c.UserAgent
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

// detectCategory: Metin içinde anahtar kelime tarayarak kategori belirler
func detectCategory(text string, keywords []models.Keyword) string {
	textLower := strings.ToLower(text)

	// En uzun kelimeden başlayarak eşleşme ara
	for _, kw := range keywords {
		if strings.Contains(textLower, strings.ToLower(kw.Word)) {
			return kw.Category
		}
	}

	return "Genel"
}
