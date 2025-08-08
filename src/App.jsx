import React, { useState, useEffect } from "react";
import {
  ExternalLink,
  Newspaper,
  Star,
  RefreshCw,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";

// Firebase
import { initializeApp } from 'firebase/app';
import {
  getAuth, signInAnonymously, onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore, collection, query, where, onSnapshot,
  addDoc, deleteDoc, doc, getDocs, getDoc, updateDoc, setDoc
} from 'firebase/firestore';

// ---- UI placeholders (shadcn 대체) ----
const Alert = ({ variant, children }) => (
  <div className={`p-4 rounded-lg my-4 ${variant === 'destructive' ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-blue-100 text-blue-700 border border-blue-300'}`}>
    {children}
  </div>
);
const AlertTitle = ({ children }) => <h5 className="font-bold text-lg mb-1">{children}</h5>;
const AlertDescription = ({ children }) => <p className="text-sm">{children}</p>;
const Card = ({ children, className }) => (
  <div className={`bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 ${className || ''}`}>
    {children}
  </div>
);
const CardContent = ({ children }) => <div className="p-4">{children}</div>;
// --------------------------------------

export default function App() {
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [latestDate, setLatestDate] = useState("");
  const [activeTab, setActiveTab] = useState("recommended");

  // Firebase states
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [bookmarkedNewsIds, setBookmarkedNewsIds] = useState(new Set());

  // AI insight stuff
  const [aiInsights, setAiInsights] = useState({});
  const [loadingInsight, setLoadingInsight] = useState({});
  const [aiInsightMetrics, setAiInsightMetrics] = useState({});
  const [aiInsightComments, setAiInsightComments] = useState([]);
  const [isGeneratingAiReply, setIsGeneratingAiReply] = useState(false);

  // ====== 🔧 교체 포인트 (너 키/설정으로 바꿔야 동작) ======
  const SHEET_ID  = "1UFE_q1cuaa4WrgATcO6MlvZOgq1zKkU_IAHrJzxPU7U"; // 예시
  const SHEET_NAME = "news";
  const GOOGLE_SHEETS_API_KEY = "YOUR_SHEETS_API_KEY"; // <-- 너의 키로 교체

  const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY"; // <-- 너의 키로 교체 (노출주의)

  // Firebase 콘솔에서 발급받은 설정값으로 교체
  const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  };
  // ======================================================

  // Firebase init & anon auth
  useEffect(() => {
    try {
      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const authInstance = getAuth(app);
      setDb(firestore);
      setAuth(authInstance);

      const unsub = onAuthStateChanged(authInstance, async (user) => {
        if (user) {
          setUserId(user.uid);
        } else {
          await signInAnonymously(authInstance);
          setUserId(authInstance.currentUser?.uid);
        }
      });
      return () => unsub();
    } catch (e) {
      console.error("Firebase 초기화 실패:", e);
      setError("앱 초기화 중 오류가 발생했습니다.");
    }
  }, []);

  // Google Sheets fetch
  const fetchNewsFromGoogleSheets = async () => {
    setLoading(true);
    setError("");
    try {
      if (!GOOGLE_SHEETS_API_KEY || GOOGLE_SHEETS_API_KEY === "YOUR_SHEETS_API_KEY") {
        throw new Error("Google Sheets API 키가 설정되지 않았습니다.");
      }
      const encodedSheetName = encodeURIComponent(SHEET_NAME);
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodedSheetName}?key=${GOOGLE_SHEETS_API_KEY}`;
      const res = await fetch(url);
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Google Sheets API 오류: ${res.status} - ${t}`);
      }
      const data = await res.json();
      const rows = data.values || [];
      const dataRows = rows.slice(1);
      const parsed = dataRows.map((row, idx) => ({
        title: row[0] || "",
        keyword: row[1] || "",
        source: row[2] || "",
        tags: row[3] || "",
        url: row[4] || "",
        date: row[5] || "",
        summary: row[6] || "",
        likes: parseInt(row[7]) || 0,
        id: idx
      })).filter(n => n.title && n.keyword);

      setNewsData(parsed);
      if (parsed.length) {
        const latest = parsed.sort((a,b)=>new Date(b.date)-new Date(a.date))[0].date;
        setLatestDate(latest);
      }
    } catch (err) {
      console.warn(err.message);
      // 시뮬레이션 데이터
      const simulated = [
        { title:"네이버, AI 검색 서비스 대폭 개선... 정확도 30% 향상", keyword:"네이버", source:"IT조선", tags:"#AI #검색 #기술혁신 #추천", url:"#", date:"2025-08-01", summary:"네이버가 자체 개발한 AI 기술을 적용...", likes:12, id:0 },
        { title:"토스, 투자 플랫폼 '토스증권' 월 거래액 10조원 돌파", keyword:"토스", source:"매일경제", tags:"#핀테크 #투자 #거래액", url:"#", date:"2025-07-31", summary:"토스증권이 월 거래액 10조원...", likes:8, id:1 },
        { title:"당근마켓, 지역 상권 활성화 프로젝트 시작", keyword:"당근마켓", source:"한국경제", tags:"#지역상권 #소상공인 #지원사업 #추천", url:"#", date:"2025-07-31", summary:"당근마켓이 지역 소상공인 지원...", likes:15, id:2 },
      ];
      setNewsData(simulated);
      setLatestDate(simulated[0].date);
      setError("Google Sheets API 키가 없어 시뮬레이션 데이터를 표시합니다.");
    } finally {
      setLoading(false);
    }
  };

  // Firestore: bookmarks
  useEffect(() => {
    if (!db || !userId) return;
    const bookmarksRef = collection(db, `artifacts/default-app/users/${userId}/bookmarks`);
    const q = query(bookmarksRef);
    const unsub = onSnapshot(q, (snap) => {
      const set = new Set(snap.docs.map(d => d.data().newsId));
      setBookmarkedNewsIds(set);
    }, () => setError("북마크를 불러오는 데 실패했습니다."));
    return () => unsub();
  }, [db, userId]);

  // Firestore: aiInsightMetrics
  useEffect(() => {
    if (!db || newsData.length === 0 || !userId) return;
    const metricsRef = collection(db, `artifacts/default-app/public/data/aiInsightMetrics`);
    const unsub = onSnapshot(metricsRef, async (snap) => {
      const fetched = {};
      snap.forEach(d => { fetched[d.id] = d.data(); });
      setAiInsightMetrics(fetched);

      for (const news of newsData) {
        if (!fetched[news.id]) {
          try {
            await setDoc(doc(metricsRef, String(news.id)), {
              upvotes: 0, downvotes: 0, newsId: news.id
            }, { merge: true });
          } catch (e) {
            console.error("메트릭스 초기화 실패:", e);
          }
        }
      }
    }, () => setError("AI 인사이트 메트릭스를 불러오는 데 실패했습니다."));
    return () => unsub();
  }, [db, userId, newsData]);

  // Firestore: comments
  useEffect(() => {
    if (!db || !userId) return;
    const commentsRef = collection(db, `artifacts/default-app/public/data/aiInsightComments`);
    const qy = query(commentsRef);
    const unsub = onSnapshot(qy, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAiInsightComments(list);
    }, () => setError("AI 인사이트 댓글을 불러오지 못했습니다."));
    return () => unsub();
  }, [db, userId]);

  const groupNewsByDate = (data) =>
    data.reduce((g, n) => ((g[n.date] ||= []).push(n), g), {});

  const filtered = activeTab === "recommended"
    ? newsData.filter(n => n.tags.includes("추천"))
    : activeTab === "bookmarks"
      ? newsData.filter(n => bookmarkedNewsIds.has(n.id))
      : newsData;

  const grouped = groupNewsByDate(filtered);
  const sortedDates = Object.keys(grouped).sort((a,b)=>new Date(b)-new Date(a));

  const [showMoreCounts, setShowMoreCounts] = useState({});
  const handleLoadMore = (date) => {
    setShowMoreCounts(prev => ({ ...prev, [date]: (prev[date] || 3) + 3 }));
  };

  const toggleBookmark = async (newsId) => {
    if (!db || !userId) { setError("북마크 처리 실패: 인증/DB 문제"); return; }
    const base = `artifacts/default-app/users/${userId}/bookmarks`;
    const ref = collection(db, base);
    try {
      if (bookmarkedNewsIds.has(newsId)) {
        const qy = query(ref, where("newsId","==",newsId));
        const snap = await getDocs(qy);
        snap.forEach(async d => await deleteDoc(doc(db, base, d.id)));
      } else {
        await addDoc(ref, { newsId, timestamp: new Date().toISOString() });
      }
    } catch (e) {
      console.error(e); setError("북마크 처리 중 오류");
    }
  };

  const fetchAiInsight = async (newsId, newsTitle) => {
    setLoadingInsight(p => ({ ...p, [newsId]: true }));
    setAiInsights(p => ({ ...p, [newsId]: "" }));
    const prompt = `"${newsTitle}" 기사의 시사점을 3줄로 요약해줘.`;
    const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;

    try {
      if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY") {
        throw new Error("Gemini API 키가 없습니다.");
      }
      const res = await fetch(url, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || "인사이트 생성 실패";
      setAiInsights(p => ({ ...p, [newsId]: text }));
    } catch (e) {
      setAiInsights(p => ({ ...p, [newsId]: `오류: ${e.message}` }));
    } finally {
      setLoadingInsight(p => ({ ...p, [newsId]: false }));
    }
  };

  const handleAiInsightVote = async (newsId, type) => {
    if (!db || !userId) { setError("투표 실패: 인증/DB 문제"); return; }
    const ref = doc(db, `artifacts/default-app/public/data/aiInsightMetrics`, String(newsId));
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const cur = snap.data();
        const update = {
          upvotes: cur.upvotes || 0,
          downvotes: cur.downvotes || 0
        };
        if (type === 'up') update.upvotes++;
        if (type === 'down') update.downvotes++;
        await updateDoc(ref, update);
      } else {
        await setDoc(ref, {
          newsId, upvotes: type === 'up' ? 1 : 0, downvotes: type === 'down' ? 1 : 0
        }, { merge: true });
      }
    } catch (e) {
      console.error(e); setError("투표 업데이트 실패");
    }
  };

  const generateAiRebuttal = async (newsId, humanCommentText, newsTitle) => {
    if (!db || !userId) return;
    setIsGeneratingAiReply(true);
    const prompt =
`뉴스 제목: "${newsTitle}"
인간 댓글: "${humanCommentText}"
[형식]
[AI의 생각]
[1줄 반박]
[근거1]
[근거2]`;
    const payload = { contents: [{ role:"user", parts:[{ text: prompt }]}] };
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;

    try {
      const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(await res.text());
      const j = await res.json();
      const raw = j?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const lines = raw.split('\n').filter(Boolean);
      const reply = lines.slice(0,4).join('\n') || "응답 생성 실패";

      await addDoc(collection(db, `artifacts/default-app/public/data/aiInsightComments`), {
        newsId, text: reply, timestamp: new Date().toISOString(), userId: "AI", role: "ai"
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingAiReply(false);
    }
  };

  const handleAddAiInsightComment = async (newsId, commentText, newsTitle) => {
    if (!commentText.trim() || !db || !userId) return;
    try {
      await addDoc(collection(db, `artifacts/default-app/public/data/aiInsightComments`), {
        newsId, text: commentText, timestamp: new Date().toISOString(), userId, role:"user"
      });
      generateAiRebuttal(newsId, commentText, newsTitle);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchNewsFromGoogleSheets(); }, []);

  // UI
 
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 bg-white shadow-sm z-10">
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Newspaper className="text-blue-600 w-6 h-6" />
            <span className="text-xl font-bold text-gray-900">정자일로 데일리 뉴스</span>
          </div>
          {latestDate && <span className="text-gray-500 text-sm">업데이트: {latestDate}</span>}
        </div>
        <div className="flex justify-start border-b border-gray-200 bg-gray-50 px-4">
          <button onClick={()=>{setActiveTab("recommended"); setShowMoreCounts({});}}
                  className={`py-3 px-6 text-lg font-semibold ${activeTab==="recommended"?"text-blue-600 border-b-2 border-blue-600":"text-gray-600 hover:text-gray-800"}`}>
            추천 뉴스
          </button>
          <button onClick={()=>{setActiveTab("all"); setShowMoreCounts({});}}
                  className={`py-3 px-6 text-lg font-semibold ${activeTab==="all"?"text-blue-600 border-b-2 border-blue-600":"text-gray-600 hover:text-gray-800"}`}>
            전체 뉴스
          </button>
          <button onClick={()=>{setActiveTab("bookmarks"); setShowMoreCounts({});}}
                  className={`py-3 px-6 text-lg font-semibold ${activeTab==="bookmarks"?"text-blue-600 border-b-2 border-blue-600":"text-gray-600 hover:text-gray-800"}`}>
            북마크
          </button>
        </div>
      </header>

      <main className="py-4">
        {loading && (
          <div className="text-center text-gray-500 p-8">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p>뉴스 데이터를 불러오는 중...</p>
          </div>
        )}
        {error && !loading && (
          <Alert variant="destructive" className="mx-4">
            <AlertTitle>알림</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {Object.keys(grouped).length === 0 && !loading && !error && (
          <div className="text-center text-gray-500 p-8">표시할 뉴스가 없습니다.</div>
        )}

        {sortedDates.map(date => (
          <div key={date} className="px-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-gray-600 text-lg font-bold">{date}</span>
            </div>
            <div className="space-y-4">
              {grouped[date].slice(0, showMoreCounts[date] || 3).map((news, idx) => (
                <Card key={news.id || idx} className="p-4 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-gray-800 mb-1 flex-grow">{news.title}</h3>
                    <button onClick={()=>toggleBookmark(news.id)}
                            className="ml-4 p-2 rounded-full hover:bg-gray-200"
                            aria-label="Toggle bookmark">
                      <Star size={24} className={bookmarkedNewsIds.has(news.id) ? "text-yellow-500" : "text-gray-400"} />
                    </button>
                  </div>
                  <div className="text-gray-500 text-sm mb-2">{news.date}</div>
                  <p className="text-gray-700 text-base leading-relaxed mb-3">{news.summary}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <span className="bg-gray-200 px-2 py-1 rounded-full text-sm text-gray-600">{news.keyword}</span>
                    <span>{news.source}</span>
                  </div>
                  {news.url && (
                    <a href={news.url} target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-1 text-blue-700 hover:text-blue-800 text-sm font-medium mb-4">
                      <ExternalLink size={16} /> 원문 보기
                    </a>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col items-end">
                    <button onClick={()=>fetchAiInsight(news.id, news.title)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                            disabled={loadingInsight[news.id]}>
                      {loadingInsight[news.id] ? 'AI 인사이트 생성 중...' : '✨AI 인사이트'}
                    </button>
                    {aiInsights[news.id] && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-md text-gray-800 text-sm w-full">
                        <p className="whitespace-pre-wrap">{aiInsights[news.id]}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-3 border-t pt-2 border-gray-200">
                          <span className="font-semibold">인사이트 평가:</span>
                          <div className="flex items-center gap-1">
                            <button onClick={()=>handleAiInsightVote(news.id,'up')} className="p-1 rounded-full hover:bg-gray-200"><ThumbsUp size={16} /></button>
                            <span>{aiInsightMetrics[news.id]?.upvotes || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={()=>handleAiInsightVote(news.id,'down')} className="p-1 rounded-full hover:bg-gray-200"><ThumbsDown size={16} /></button>
                            <span>{aiInsightMetrics[news.id]?.downvotes || 0}</span>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h5 className="text-md font-semibold text-gray-700 mb-2">AI 인사이트에 대한 인간의 반박💬</h5>
                          <div className="space-y-2 mb-3">
                            {aiInsightComments
                              .filter(c => c.newsId === news.id)
                              .sort((a,b)=> new Date(a.timestamp) - new Date(b.timestamp))
                              .map((c,i)=>(
                                <div key={c.id || i}
                                  className={`p-2 rounded-md text-sm ${c.role==="ai"?"bg-blue-50 text-blue-800 ml-4":"bg-gray-100 text-gray-800"}`}>
                                  <p className="whitespace-pre-wrap">{c.text}</p>
                                  <span className="text-xs text-gray-500">
                                    {c.role==="ai" ? "AI" : c.userId?.substring(0,8)+"..."} - {new Date(c.timestamp).toLocaleString()}
                                  </span>
                                </div>
                              ))}
                            {aiInsightComments.filter(c=>c.newsId===news.id).length===0 && (
                              <p className="text-sm text-gray-500">아직 인사이트에 대한 댓글이 없습니다.</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="인사이트에 대한 댓글을 입력하세요..."
                              className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              id={`ai-insight-comment-input-${news.id}`}
                              onKeyPress={(e)=>{
                                if(e.key==='Enter'){
                                  handleAddAiInsightComment(news.id, e.target.value, news.title);
                                  e.target.value='';
                                }
                              }}
                              disabled={isGeneratingAiReply}
                            />
                            <button
                              onClick={()=>{
                                const el = document.getElementById(`ai-insight-comment-input-${news.id}`);
                                if (el) { handleAddAiInsightComment(news.id, el.value, news.title); el.value=''; }
                              }}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                              disabled={isGeneratingAiReply}
                            >
                              {isGeneratingAiReply ? 'AI 생각중...' : 'AI에게 반박'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
              {grouped[date].length > (showMoreCounts[date] || 3) && (
                <div className="text-center mt-4">
                  <button onClick={()=>handleLoadMore(date)}
                          className="px-6 py-2 bg-gray-200 text-gray-800 rounded-full font-semibold hover:bg-gray-300">
                    더 불러오기 ({grouped[date].length - (showMoreCounts[date] || 3)}개 남음)
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
