import React, { useState, useEffect, useCallback } from "react";
import {
  ExternalLink,
  Newspaper,
  Star,
  MessageCircle,
} from "lucide-react";

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, where, onSnapshot } from 'firebase/firestore';

// These are placeholder components to mimic shadcn/ui for this single-file immersive.
const Alert = ({ variant, children, className }) => {
  // 클래스 문자열 구성 방식을 단순화하여 환경 오류를 방지합니다.
  let finalClasses = "p-4 rounded-lg my-4 text-sm ";
  
  if (variant === 'destructive') {
    finalClasses += 'bg-red-100 text-red-700 border border-red-300';
  } else {
    finalClasses += 'bg-blue-100 text-blue-700 border border-blue-300';
  }
  
  if (className) {
    finalClasses += ' ' + className;
  }

  return (
    <div className={finalClasses}>
      {children}
    </div>
  );
};

const Card = ({ children, className }) => {
  // 클래스 문자열 구성 방식을 단순화하여 환경 오류를 방지합니다.
  let finalClasses = "bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 transition-all duration-300 hover:shadow-xl";
  
  if (className) {
    finalClasses += ' ' + className;
  }

  return (
    <div className={finalClasses}>
      {children}
    </div>
  );
};

const ITNewsApp = () => {
  // State for news data and UI elements
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [latestDate, setLatestDate] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  // activeSubTab 상태는 더 이상 사용하지 않지만, 필터링 로직을 위해 'it'으로 고정합니다.
  const [activeSubTab, setActiveSubTab] = useState("it"); 

  // State for Firebase services and user authentication
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // --- Configuration ---
  const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'it-news-app-preview';
  const SHEET_ID = "1UFE_q1cuaa4WrgATcO6MlvZOgq1zKkU_IAHrJzxPU7U";
  const SHEET_NAME = "news";
  const GOOGLE_SHEETS_API_KEY = "AIzaSyDIig_uUt8grXOehM3JyI_sabFBh3EuTS8";

  // --- Utility Functions (using localStorage as per original design) ---
  const getBookmarksFromStorage = () => {
    try {
      const bookmarks = localStorage.getItem('news-bookmarks');
      return bookmarks ? new Set(JSON.parse(bookmarks)) : new Set();
    } catch (error) {
      console.error('북마크 데이터 로드 실패:', error);
      return new Set();
    }
  };

  const saveBookmarksToStorage = (bookmarks) => {
    try {
      localStorage.setItem('news-bookmarks', JSON.stringify([...bookmarks]));
    } catch (error) {
      console.error('북마크 데이터 저장 실패:', error);
    }
  };

  // State for application features
  const [bookmarkedNewsIds, setBookmarkedNewsIds] = useState(() => getBookmarksFromStorage());
  const [selectedKeyword, setSelectedKeyword] = useState(null);

  // --- Firebase Initialization & Authentication ---
  useEffect(() => {
    let firebaseConfig;
    try {
      firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
    } catch(e) {
      console.error("Failed to parse Firebase config:", e);
      setError("앱 설정을 불러오는 데 실패했습니다.");
      setLoading(false);
      return;
    }

    try {
      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const authInstance = getAuth(app);
      
      setDb(firestore);
      setAuth(authInstance);

      const unsubscribeAuth = onAuthStateChanged(authInstance, async (user) => {
        if (user) {
          setUserId(user.uid);
        } else {
          try {
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
              await signInWithCustomToken(authInstance, __initial_auth_token);
            } else {
              await signInAnonymously(authInstance);
            }
            setUserId(authInstance.currentUser?.uid);
          } catch (authError) {
            console.error("Authentication failed:", authError);
            setError("사용자 인증에 실패했습니다. 익명 모드로 진행합니다.");
            setUserId(crypto.randomUUID());
          }
        }
        setIsAuthReady(true);
      });

      return () => unsubscribeAuth();
    } catch (e) {
      console.error("Firebase initialization failed:", e);
      setError("앱 초기화 중 오류가 발생했습니다.");
      setLoading(false);
    }
  }, []);


  // --- Data Fetching: Google Sheets News ---
  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError("");

    const dataMapping = {
      title: 0,
      keyword: 1,
      source: 2,
      tags: 3,
      url: 4,
      date: 5,
      summary: 6,
      content: 7,
      imageUrl: 8,
      nickname: 9,
      companyName: 10,
      jobTitle: 11,
      recommendationStrength: 12,
      recommendationReason: 13,
      likes: 14,
    };

    if (!GOOGLE_SHEETS_API_KEY) {
      console.warn("Google Sheets API key is missing. Using simulated data.");
      loadSimulatedData();
      return;
    }

    try {
      const encodedSheetName = encodeURIComponent(SHEET_NAME);
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodedSheetName}?key=${GOOGLE_SHEETS_API_KEY}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Google Sheets API Error: ${response.status} - ${errorData.error.message}`);
      }

      const data = await response.json();
      const rows = data.values;

      if (!rows || rows.length <= 1) {
        throw new Error("No data found in Google Sheets.");
      }

      const dataRows = rows.slice(1);
      const parsedNews = dataRows.map((row) => {
        const newsItem = {};

        // Assign data from row to newsItem object
        Object.keys(dataMapping).forEach(key => {
          newsItem[key] = row[dataMapping[key]] || '';
        });

        // Generate a consistent, unique ID based on title and date
        newsItem.id = newsItem.title.replace(/[^a-zA-Z0-9가-힣]/g, '') + '-' + newsItem.date;

        return newsItem;
      }).filter(news => news.title);

      setNewsData(parsedNews);
      if (parsedNews.length > 0) {
        const latest = parsedNews.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date;
        setLatestDate(latest);
      }
    } catch (err) {
      console.error("Failed to fetch from Google Sheets:", err);
      setError("뉴스 데이터를 불러오는 데 실패했습니다. (시뮬레이션 데이터 사용)");
      loadSimulatedData();
    } finally {
      setLoading(false);
    }
  }, [GOOGLE_SHEETS_API_KEY, SHEET_ID, SHEET_NAME]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Simulated data for development/fallback
  const loadSimulatedData = useCallback(() => {
    const commonSimulatedData = [
      {
        title: "네이버, AI 검색 서비스 대폭 개선... 정확도 30% 향상", keyword: "네이버", source: "IT조선", tags: "#AI #검색 #기술혁신 #추천", url: "https://example.com/news1", date: "2025-08-01", time: '16:10', summary: "네이버가 자체 개발한 AI 기술을 적용하여 검색 정확도를 크게 개선했으며, 사용자 만족도가 크게 향상될 것으로 예상됩니다.", content: "이는 대규모 언어 모델(LLM)과 최신 검색 알고리즘을 결합한 결과입니다. 사용자들은 이제 더 빠르고 정확한 정보를 얻을 수 있을 것으로 기대됩니다.",
        imageUrl: "https://placehold.co/100x80/2DB400/FFFFFF?text=NAVER_NEWS",
        nickname: "개발자김", companyName: "네이버", jobTitle: "AI 개발자", recommendationStrength: 5, recommendationReason: "이 기사는 AI 검색의 미래를 보여줍니다.", likes: 12
      },
      {
        title: "토스, 투자 플랫폼 '토스증권' 월 거래액 10조원 돌파", keyword: "토스", source: "매일경제", tags: "#핀테크 #투자 #거래액 #추천", url: "https://example.com/news2", date: "2025-07-31", time: '16:00', summary: "토스증권이 월 거래액 10조원을 돌파하며 핀테크 시장의 새로운 강자로 떠올랐습니다.", content: "간편한 인터페이스와 다양한 투자 상품으로 2030 세대의 높은 지지를 받고 있으며, 시장 점유율을 빠르게 확대하고 있습니다.",
        imageUrl: "https://placehold.co/100x80/0046FF/FFFFFF?text=TOSS_NEWS",
        nickname: "투자박", companyName: "토스", jobTitle: "증권 애널리스트", recommendationStrength: 4, recommendationReason: "핀테크 투자의 중요성을 강조합니다.", likes: 8
      },
      {
        title: "카카오, 새로운 소셜 서비스 '카카오뷰' 출시", keyword: "카카오", source: "전자신문", tags: "#소셜 #플랫폼 #신규서비스", url: "https://example.com/news3", date: "2025-07-31", time: '15:30', summary: "카카오가 콘텐츠 큐레이션 기반의 새로운 소셜 서비스 '카카오뷰'를 출시하며 플랫폼 영향력 강화에 나섰습니다.", content: "사용자들이 직접 콘텐츠를 큐레이션하고 발행할 수 있는 기능을 제공하며, 새로운 정보 소비 방식을 제안합니다.",
        imageUrl: "https://placehold.co/100x80/F9E000/000000?text=KAKAO_NEWS",
        nickname: "콘텐츠이", companyName: "카카오", jobTitle: "서비스 기획자", recommendationStrength: 3, recommendationReason: "새로운 소셜 경험을 위한 필수 서비스.", likes: 25
      },
      {
        title: "당근마켓, 지역 커뮤니티 활성화로 월 사용자 2천만 명 달성", keyword: "당근마켓", source: "블로터", tags: "#커뮤니티 #중고거래 #추천", url: "https://example.com/news4", date: "2025-07-30", time: '10:00', summary: "당근마켓이 단순 중고거래를 넘어 지역 커뮤니티 플랫폼으로 자리매김하며 월간 활성 사용자(MAU) 2천만 명을 돌파했습니다.", content: "이웃과의 소통과 정보 교환을 통해 지역 생활에 필수적인 앱으로 성장했으며, 다양한 연령대의 사용자를 확보하고 있습니다.",
        imageUrl: "https://placehold.co/100x80/FF6F00/FFFFFF?text=DAANGN_NEWS",
        nickname: "마케터정", companyName: "당근마켓", jobTitle: "마케팅 전문가", recommendationStrength: 5, recommendationReason: "지역 기반 서비스의 성공 사례입니다.", likes: 40
      },
      {
        title: "새로운 기술 동향, 블록체인 기반 서비스 확산", keyword: "블록체인", source: "테크월드", tags: "#블록체인 #기술동향", url: "https://example.com/news5", date: "2025-08-01", time: '09:00', summary: "블록체인 기술이 다양한 산업 분야로 확산되며 새로운 서비스 모델을 제시하고 있습니다.", content: "금융, 유통, 제조 등 여러 분야에서 블록체인 기반의 혁신적인 솔루션이 등장하고 있으며, 이에 대한 기대감이 커지고 있습니다.",
        imageUrl: "https://placehold.co/100x80/4A90E2/FFFFFF?text=BLOCKCHAIN",
        nickname: "", companyName: "", jobTitle: "", recommendationStrength: 0, recommendationReason: "", likes: 7
      },
      {
        title: "클라우드 서비스, 기업 디지털 전환 핵심으로 부상", keyword: "클라우드", source: "디지털데일리", tags: "#클라우드 #디지털전환", url: "https://example.com/news6", date: "2025-08-01", time: '08:00', summary: "클라우드 컴퓨팅이 기업의 디지털 전환을 가속화하는 핵심 기술로 주목받고 있습니다.", content: "유연성과 확장성을 바탕으로 기업 IT 인프라의 효율성을 극대화하며, 새로운 비즈니스 기회를 창출하고 있습니다.",
        imageUrl: "https://placehold.co/100x80/FF9900/FFFFFF?text=CLOUD",
        nickname: "클라우드김", companyName: "AWS", jobTitle: "클라우드 아키텍트", recommendationStrength: 4, recommendationReason: "클라우드 도입을 고민하는 기업에게 필독!", likes: 15
      },
      {
        // 이 뉴스는 이제 필터링되어 보이지 않습니다.
        title: "서울 아파트 매매가, 3개월 연속 상승세... '부동산 규제 완화' 영향", keyword: "부동산", source: "조선일보", tags: "#부동산 #아파트 #매매가 #투자", url: "https://example.com/news7", date: "2025-08-02", time: '10:30', summary: "서울 지역 아파트 매매가가 3개월 연속 상승세를 기록하며 부동산 시장이 활기를 되찾고 있습니다. 전문가들은 정부의 부동산 규제 완화 정책이 영향을 미쳤다고 분석합니다.", content: "강남, 서초 등 주요 지역을 중심으로 매물이 소진되고 있으며, 신축 아파트 단지의 청약 경쟁률도 높아지고 있습니다. 다만, 금리 인상 가능성과 경기 불확실성이 여전히 변수로 남아있습니다.",
        imageUrl: "https://placehold.co/100x80/006400/FFFFFF?text=REAL+ESTATE",
        nickname: "집주인최", companyName: "대한부동산", jobTitle: "부동산 중개사", recommendationStrength: 5, recommendationReason: "실거주와 투자 모두 고려해야 할 시점입니다.", likes: 2
      },
    ];

    // 부동산 키워드를 가진 뉴스 필터링 로직 제거
    const filteredSimulatedData = commonSimulatedData.filter(news => news.keyword !== '부동산');

    const parsedNews = filteredSimulatedData.map(news => ({
      ...news,
      id: news.title.replace(/[^a-zA-Z0-9가-힣]/g, '') + '-' + news.date
    }));

    setNewsData(parsedNews);
    if (parsedNews.length > 0) {
      const latest = parsedNews.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date;
      setLatestDate(latest);
    }
    setLoading(false);
  }, []);

  // localStorage 기반 북마크 초기화 및 동기화
  useEffect(() => {
    // 앱 시작 시 localStorage에서 북마크 로드
    const storedBookmarks = getBookmarksFromStorage();
    setBookmarkedNewsIds(storedBookmarks);
  }, []);

  // --- Event Handlers & Logic ---

  const toggleBookmark = (newsId) => {
    setBookmarkedNewsIds(prev => {
      const newBookmarks = new Set(prev);
      if (newBookmarks.has(newsId)) {
        newBookmarks.delete(newsId);
      } else {
        newBookmarks.add(newsId);
      }
      saveBookmarksToStorage(newBookmarks);
      return newBookmarks;
    });
  };

  // --- Rendering Logic ---
  const filteredNewsData = newsData.filter(news => {
    // 기본 필터링: 최근 7일 뉴스만
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const isRecent = new Date(news.date) >= oneWeekAgo;

    // 메인 탭에 따른 필터링 (activeTab이 'all'일 때만 키워드 필터링 적용)
    if (activeTab === "all") {
      // 부동산 관련 필터링 로직 제거. 이제 newsData 자체가 IT 뉴스만 포함한다고 가정.
      const matchesKeyword = !selectedKeyword || news.keyword === selectedKeyword;
      return isRecent && matchesKeyword;
    }
    if (activeTab === "bookmarks") {
      return bookmarkedNewsIds.has(news.id);
    }
    return true;
  });

  // 이제 newsData는 IT/테크 뉴스만 포함하므로, '부동산' 필터링 로직이 필요 없습니다.
  const uniqueKeywords = [...new Set(newsData.map(news => news.keyword).filter(Boolean))];

  const groupedNewsByDate = filteredNewsData.reduce((groups, news) => {
    const date = news.date || "날짜 없음";
    if (!groups[date]) groups[date] = [];
    groups[date].push(news);
    return groups;
  }, {});
  const sortedDates = Object.keys(groupedNewsByDate).sort((a, b) => new Date(b) - new Date(a));

  // 키워드 스크롤 컨테이너 ID
  const KEYWORD_SCROLL_ID = "keyword-scroll-container";

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Scrollbar Hide CSS for the Keyword List (Fixes layout issue on some browsers/devices) */}
      <style>
        {`
          /* Custom styles to hide scrollbar specifically for the keyword container */
          #${KEYWORD_SCROLL_ID}::-webkit-scrollbar {
            display: none;
          }
          #${KEYWORD_SCROLL_ID} {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
          }
        `}
      </style>

      {/* Header Section */}
      <header className="sticky top-0 bg-white shadow-md z-20">
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Newspaper className="text-blue-600 w-7 h-7" />
            <h1 className="text-2xl font-extrabold text-gray-900">키워드뉴스</h1>
          </div>
          {latestDate && (
            <span className="text-gray-500 text-xs sm:text-sm self-center">
              최신 업데이트: {latestDate}
            </span>
          )}
        </div>
        {/* Navigation Tabs (Sub-navigation tabs are removed) */}
        <div className="flex justify-start border-b border-gray-200 bg-gray-50 px-4">
          {["all", "bookmarks"].map(tab => (
            <button
              key={tab}
              onClick={() => { 
                setActiveTab(tab); 
                setActiveSubTab(tab === 'all' ? 'it' : null); // Keep internal state 'it' for 'all' tab
                setSelectedKeyword(null); 
              }}
              className={"py-3 px-5 text-base font-semibold transition-colors duration-200 sm:px-6 " +
                (activeTab === tab
                  ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-100")
              }
            >
              {tab === 'all' ? '전체 뉴스' : '북마크'}
            </button>
          ))}
        </div>
        {/* Removed Sub-navigation for "전체" tab */}
      </header>

      {/* Main Content Area */}
      <main className="p-4 sm:p-6">
        {loading && <div className="text-center text-gray-500 p-8"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div><p>뉴스 데이터를 불러오는 중...</p></div>}
        {error && !loading && <Alert variant="destructive" className="mx-auto max-w-4xl">{error}</Alert>}

        {/* Keyword Filter is now shown directly under 'all' tab */}
        {activeTab === 'all' && !loading && (
          <div className="max-w-4xl mx-auto mb-6">
            <h3 className="text-md font-semibold text-gray-700 mb-2">키워드 필터</h3>
            <div id={KEYWORD_SCROLL_ID} className="flex overflow-x-auto whitespace-nowrap gap-2 pb-2">
              <button
                onClick={() => setSelectedKeyword(null)}
                className={"px-4 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 flex-shrink-0 " +
                  (selectedKeyword === null 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300')
                }
              >
                #전체보기
              </button>
              {uniqueKeywords.map(keyword => (
                <button
                  key={keyword}
                  onClick={() => setSelectedKeyword(keyword)}
                  className={"px-4 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 flex-shrink-0 " +
                    (selectedKeyword === keyword 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300')
                  }
                >
                  #{keyword}
                </button>
              ))}
            </div>
          </div>
        )}

        {['all', 'bookmarks'].includes(activeTab) && !loading && (
            <>
              {sortedDates.length === 0 && !error && (
                  <div className="text-center text-gray-500 p-8 mt-8 bg-white rounded-xl shadow-lg max-w-4xl mx-auto">
                      <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-xl font-semibold text-gray-700">표시할 뉴스가 없습니다.</h3>
                      <p className="text-gray-500 mt-2">
                          {activeTab === 'bookmarks' ? '북마크한 뉴스가 여기에 표시됩니다.' :
                            '선택한 키워드나 기간에 해당하는 뉴스가 없습니다.'}
                      </p>
                  </div>
              )}
              {sortedDates.map(date => (
                  <section key={date} className="max-w-4xl mx-auto mb-10">
                      <h2 className="text-xl font-extrabold text-gray-800 mb-4 pl-3 border-l-4 border-blue-500">{date}</h2>
                      <div className="space-y-5">
                          {groupedNewsByDate[date].map((news) => (
                              <Card key={news.id} className="p-5">
                                <div className="flex justify-between items-start gap-4">
                                  <div className="flex-grow min-w-0">
                                    {/* News Title: Increased size and ensured text wrapping */}
                                    <h3 className="text-xl font-bold text-gray-900 leading-snug mb-2 pr-4">{news.title}</h3>
                                  </div>
                                  <button onClick={() => toggleBookmark(news.id)} className="p-2 rounded-full hover:bg-yellow-100 transition-colors flex-shrink-0" aria-label="Toggle bookmark">
                                    <Star size={24} className={bookmarkedNewsIds.has(news.id) ? "text-yellow-500 fill-current" : "text-gray-400 hover:text-yellow-500"} />
                                  </button>
                                </div>
                                
                                <div className="flex items-start gap-4 mt-3">
                                  {news.imageUrl && (
                                    <img
                                      src={news.imageUrl}
                                      alt={news.title}
                                      className="w-28 h-24 object-cover rounded-lg flex-shrink-0 border border-gray-100"
                                      onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/112x96/E2E8F0/64748B?text=No+Img"; }}
                                    />
                                  )}
                                  <p className="flex-grow text-gray-700 text-base leading-relaxed">{news.summary}</p>
                                </div>

                                {/* Detailed Content/Recommendation */}
                                {(news.content || news.recommendationReason) && (
                                  <div className="mt-4 pt-4 border-t border-gray-100">
                                    {news.content && (
                                      <div className="text-gray-700 text-sm leading-relaxed mb-3">{news.content}</div>
                                    )}
                                    {news.recommendationReason && (
                                      <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-lg text-sm text-blue-800">
                                        <div className="font-bold mb-1">
                                          {news.nickname || '익명'} ({news.companyName} / {news.jobTitle}) 추천 ({news.recommendationStrength}/5)
                                        </div>
                                        <div>{news.recommendationReason}</div>
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                <div className="flex justify-between items-end text-sm text-gray-600 mt-4 pt-3 border-t border-gray-50">
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">{news.keyword}</span>
                                    <span className="text-gray-500 text-xs sm:text-sm font-medium">{news.source}</span>
                                    <span className="text-gray-500 text-xs sm:text-sm flex-shrink-0">{news.date}</span>
                                    {news.url && <a href={news.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-medium text-sm"><ExternalLink size={14} />원문 보기</a>}
                                  </div>
                                  <div className="flex items-center gap-1 text-red-500 font-semibold text-xs sm:text-sm">
                                    <span className="text-gray-400">👍</span>
                                    {news.likes || 0}
                                  </div>
                                </div>
                              </Card>
                          ))}
                      </div>
                  </section>
              ))}
            </>
        )}
      </main>
    </div>
  );
};

export default ITNewsApp;
