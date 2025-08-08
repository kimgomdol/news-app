import React, { useState, useEffect } from "react";
import {
  ExternalLink,
  Newspaper,
  Star,
  RefreshCw,
  // ThumbsUp, ThumbsDown, // Firebase 관련 아이콘 삭제
} from "lucide-react";

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
  const [activeTab, setActiveTab] = useState("all"); // 기본 탭을 전체 뉴스로 변경

  // Firebase 관련 상태 및 로직 모두 삭제
  // API 키를 직접 교체
  const SHEET_ID = "1UFE_q1cuaa4WrgATcO6MlvZOgq1zKkU_IAHrJzxPU7U";
  const SHEET_NAME = "news";
  const GOOGLE_SHEETS_API_KEY = "AIzaSyDIig_uUt8grXOehM3JyI_sabFBh3EuTS8";
  const GEMINI_API_KEY = "AIzaSyDIig_uUt8grXOehM3JyI_sabFBh3EuTS8";

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
        const latest = parsed.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date;
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

  useEffect(() => { fetchNewsFromGoogleSheets(); }, []);

  const groupNewsByDate = (data) =>
    data.reduce((g, n) => ((g[n.date] ||= []).push(n), g), {});

  // 모든 탭 로직을 "전체 뉴스"로 통일 (북마크, 추천 로직 삭제)
  const filtered = newsData; // 더 이상 필터링이 필요 없으므로 newsData를 그대로 사용
  const grouped = groupNewsByDate(filtered);
  const sortedDates = Object.keys(grouped).sort((a,b)=>new Date(b)-new Date(a));

  const [showMoreCounts, setShowMoreCounts] = useState({});
  const handleLoadMore = (date) => {
    setShowMoreCounts(prev => ({ ...prev, [date]: (prev[date] || 3) + 3 }));
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

  // 기존 Firebase 관련 이벤트 핸들러(toggleBookmark, handleAiInsightVote 등) 모두 삭제

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
          <button onClick={() => fetchNewsFromGoogleSheets()} className="p-2 rounded-full hover:bg-gray-100">
            <RefreshCw size={24} className="text-gray-600" />
          </button>
        </div>
        <div className="flex justify-start border-b border-gray-200 bg-gray-50 px-4">
          {/* 탭 기능 간소화 */}
          <button onClick={()=>{setActiveTab("all"); setShowMoreCounts({});}}
                  className={`py-3 px-6 text-lg font-semibold text-blue-600 border-b-2 border-blue-600`}>
            전체 뉴스
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
                    {/* 북마크 버튼 삭제 */}
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
                        {/* 인사이트 평가 및 댓글 섹션 삭제 */}
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