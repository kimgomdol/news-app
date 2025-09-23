<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Connect Insight</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap');
        body {
            font-family: 'Noto Sans KR', sans-serif;
            background-color: #2c2f33; /* Dark background */
            color: #d1d5db; /* Light text color */
        }
        .scroll-container::-webkit-scrollbar {
            display: none;
        }
        .scroll-container {
            -ms-overflow-style: none; /* IE and Edge */
            scrollbar-width: none; /* Firefox */
        }
        .action-button {
            transition: all 0.2s ease-in-out;
        }
        .action-button:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
        }
        .btn-active {
            font-weight: 700;
            color: #ffffff;
            border-bottom: 2px solid #ffffff;
        }
        .spinner {
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid #fff;
            border-radius: 50%;
            width: 2rem;
            height: 2rem;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .tag-pill {
            cursor: pointer;
            transition: background-color 0.2s, color 0.2s;
        }
        .tag-pill.selected {
            background-color: #10b981;
            color: white;
        }
        .autocomplete-list {
            position: absolute;
            z-index: 10;
            background-color: #363a40;
            border: 1px solid #4a5568;
            border-radius: 0.5rem;
            max-height: 200px;
            overflow-y: auto;
        }
        .autocomplete-item {
            padding: 0.5rem 1rem;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        .autocomplete-item:hover {
            background-color: #4a5568;
        }
    </style>
</head>
<body class="min-h-screen flex flex-col">

    <!-- Header & Navigation -->
    <header class="bg-[#363a40] p-4 flex justify-between items-center shadow-md sticky top-0 z-10">
        <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#25d366" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-refresh-cw">
                <path d="M23 4v6h-6"></path>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
            <h1 class="text-xl font-bold text-gray-100 ml-2">Connect Insight</h1>
        </div>
        <div class="flex items-center space-x-4 text-sm">
            <button id="feedBtn" class="nav-btn btn-active text-gray-400 hover:text-white transition-colors">피드</button>
            <button id="libraryBtn" class="nav-btn text-gray-400 hover:text-white transition-colors">내 서재</button>
            <button id="bookmarkBtn" class="nav-btn text-gray-400 hover:text-white transition-colors">북마크</button>
        </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-grow p-4 scroll-container overflow-y-auto">

        <!-- Feed Section -->
        <div id="feedSection" class="space-y-6">
            <!-- 로딩 스피너 -->
            <div id="feedLoading" class="flex flex-col items-center py-8">
                <div class="spinner mb-4"></div>
                <span class="text-gray-400">피드를 불러오는 중입니다...</span>
            </div>
            <!-- 포스트가 여기에 동적으로 추가됩니다 -->
        </div>

        <!-- My Library Section (Initially hidden) -->
        <div id="librarySection" class="hidden">
            <div id="myProfileHeader" class="bg-[#363a40] rounded-xl p-4 mb-4 border border-gray-700 flex flex-col items-center">
                <div class="w-12 h-12 rounded-full flex items-center justify-center bg-purple-500 text-white font-bold text-xl mb-2">KS</div>
                <div class="text-sm font-semibold text-gray-100">김성민</div>
                <div class="text-xs text-gray-400">네이버 쇼핑플랫폼기획 / 15년차</div>
                <hr class="border-t border-gray-600 w-full my-4">
                <div class="flex justify-around items-center w-full text-center">
                    <div>
                        <div id="totalBooks" class="text-sm font-bold text-gray-100">📖 0</div>
                        <div class="text-xs text-gray-400">전체</div>
                    </div>
                    <div>
                        <div id="readingBooks" class="text-sm font-bold text-gray-100">📚 0</div>
                        <div class="text-xs text-gray-400">읽는 중</div>
                    </div>
                    <div>
                        <div id="completedBooks" class="text-sm font-bold text-gray-100">✅ 0</div>
                        <div class="text-xs text-gray-400">완료</div>
                    </div>
                </div>
            </div>
            
            <!-- My Tags Section -->
            <div id="myTagsSection" class="bg-[#363a40] rounded-xl p-4 mb-4 border border-gray-700">
                <h2 class="text-sm font-bold text-gray-100 mb-2">나의 관심 태그</h2>
                <div id="myTagsContainer" class="flex flex-wrap gap-2">
                    <!-- 태그가 여기에 동적으로 추가됩니다 -->
                </div>
            </div>

            <div id="bookListContainer" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <!-- 책 표지가 여기에 동적으로 추가됩니다 -->
            </div>
        </div>
        
        <!-- Bookmark Section (Initially hidden) -->
        <div id="bookmarkSection" class="hidden space-y-6">
            <h2 class="text-xl font-bold text-gray-100 mb-4">북마크한 게시물</h2>
            <div id="bookmarkList" class="space-y-6">
                <div class="text-center text-gray-400">아직 북마크한 게시물이 없습니다.</div>
            </div>
        </div>

        <!-- Book Posts Section (Initially hidden) -->
        <div id="bookPostsSection" class="hidden space-y-6">
            <button id="backBtn" class="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-left">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                <span>뒤로 가기</span>
            </button>
            <div id="bookDetailHeader" class="bg-[#363a40] p-4 rounded-xl shadow-md border border-gray-700 mb-6">
                <!-- 책 상세 정보 헤더가 여기에 동적으로 추가됩니다 -->
            </div>
            <div id="filteredPostsContainer" class="space-y-6">
                <!-- 필터링된 포스트가 여기에 추가됩니다 -->
            </div>
        </div>

        <!-- Profile Detail Section (Initially hidden) -->
        <div id="profileDetailSection" class="hidden space-y-6">
            <div class="flex items-center justify-between mb-4">
                <button id="backToFeedFromProfileBtn" class="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-left">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                    <span>피드로 돌아가기</span>
                </button>
                <button id="connectBtn" class="bg-gray-700 text-gray-200 text-sm px-4 py-2 rounded-full font-semibold hover:bg-teal-500 hover:text-white transition-colors">Connect</button>
            </div>
            <div id="profileHeader" class="bg-[#363a40] rounded-xl p-4 border border-gray-700 flex flex-col items-center">
                <!-- 프로필 헤더 정보가 여기에 동적으로 추가됩니다 -->
                <div class="flex flex-col items-center w-full">
                    <img id="profileImage" src="" alt="프로필 이미지" class="w-16 h-16 rounded-full object-cover mb-2">
                    <div id="profileName" class="text-lg font-bold text-gray-100"></div>
                    <div id="profileDetails" class="text-sm text-gray-400"></div>
                    <div id="connectCount" class="text-sm font-bold text-gray-100 mt-2"></div>
                </div>
            </div>
            <div class="w-full text-center mt-4">
                <h3 class="text-sm font-bold text-gray-100 mb-2">주요 관심 태그</h3>
                <div id="profileTagsContainer" class="flex flex-wrap justify-center gap-2">
                    <!-- 태그가 여기에 동적으로 추가됩니다 -->
                </div>
            </div>
            <div id="profileBooksContainer" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <!-- 프로필 책 목록이 여기에 동적으로 추가됩니다 -->
            </div>
        </div>

    </main>

    <!-- Floating Action Button for adding new quote -->
    <button id="addQuoteBtn" class="action-button fixed bottom-8 right-8 bg-teal-500 text-white p-4 rounded-full shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-plus">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    </button>

    <!-- Add Quote Modal (Initially hidden) -->
    <div id="addQuoteModal" class="hidden fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4">
        <div class="bg-[#363a40] rounded-xl p-6 w-full max-w-lg shadow-2xl">
            <h2 class="text-lg font-bold mb-3 text-center text-gray-100">문구 추가하기</h2>
            <p class="text-sm text-gray-400 mb-3 text-center">밑줄 친 문구의 사진을 업로드해 주세요.</p>

            <!-- Image Upload and Preview Area -->
            <div class="flex flex-col items-center mb-4">
                <label for="imageUpload" class="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-gray-500 rounded-lg cursor-pointer hover:border-teal-400 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-image text-gray-500 mb-2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <span class="text-sm text-gray-400">사진 업로드</span>
                    <input id="imageUpload" type="file" accept="image/*" class="hidden">
                </label>
            </div>
            <div id="ocrLoading" class="hidden flex justify-center items-center py-4">
                <div class="spinner"></div>
                <span class="ml-4 text-gray-400">텍스트 추출 중...</span>
            </div>

            <div class="space-y-3">
                <label class="block relative">
                    <span class="text-gray-300 text-sm">책 제목</span>
                    <input id="bookTitle" type="text" class="mt-1 block w-full rounded-md border-gray-600 shadow-sm p-2 text-sm focus:ring-teal-400 focus:border-teal-400 bg-gray-700 text-gray-200 border" placeholder="책 제목을 입력하세요">
                    <div id="bookSearchResults" class="autocomplete-list w-full mt-1 hidden"></div>
                </label>
                <label class="block">
                    <span class="text-gray-300 text-sm">추출된 문구</span>
                    <textarea id="extractedText" class="mt-1 block w-full rounded-md border-gray-600 shadow-sm p-2 text-sm focus:ring-teal-400 focus:border-teal-400 bg-gray-700 text-gray-200 border resize-none h-32" placeholder="사진에서 추출된 텍스트가 여기에 나타납니다."></textarea>
                </label>
                <label class="block">
                    <span class="text-gray-300 text-sm">내 생각 (선택 사항)</span>
                    <textarea id="myThought" class="mt-1 block w-full rounded-md border-gray-600 shadow-sm p-2 text-sm focus:ring-teal-400 focus:border-teal-400 bg-gray-700 text-gray-200 border resize-none h-20" placeholder="이 문구를 읽고 느낀 생각을 자유롭게 작성해 주세요."></textarea>
                </label>
                <div class="block">
                    <span class="text-gray-300 text-sm">태그</span>
                    <div id="tagContainer" class="flex flex-wrap gap-2 mt-1">
                        <span class="tag-pill bg-gray-700 text-gray-400 text-xs px-3 py-1 rounded-full hover:bg-gray-600 transition-colors" data-tag="조직관리">#조직관리</span>
                        <span class="tag-pill bg-gray-700 text-gray-400 text-xs px-3 py-1 rounded-full hover:bg-gray-600 transition-colors" data-tag="리더십">#리더십</span>
                        <span class="tag-pill bg-gray-700 text-gray-400 text-xs px-3 py-1 rounded-full hover:bg-gray-600 transition-colors" data-tag="성장">#성장</span>
                        <span class="tag-pill bg-gray-700 text-gray-400 text-xs px-3 py-1 rounded-full hover:bg-gray-600 transition-colors" data-tag="마인드셋">#마인드셋</span>
                        <span class="tag-pill bg-gray-700 text-gray-400 text-xs px-3 py-1 rounded-full hover:bg-gray-600 transition-colors" data-tag="동기부여">#동기부여</span>
                        <span class="tag-pill bg-gray-700 text-gray-400 text-xs px-3 py-1 rounded-full hover:bg-gray-600 transition-colors" data-tag="경영">#경영</span>
                        <span class="tag-pill bg-gray-700 text-gray-400 text-xs px-3 py-1 rounded-full hover:bg-gray-600 transition-colors" data-tag="인간관계">#인간관계</span>
                        <span class="tag-pill bg-gray-700 text-gray-400 text-xs px-3 py-1 rounded-full hover:bg-gray-600 transition-colors" data-tag="자기계발">#자기계발</span>
                    </div>
                </div>
            </div>

            <div class="flex justify-end mt-4 space-x-2">
                <button id="closeModalBtn" class="px-4 py-2 bg-gray-600 text-gray-200 rounded-full text-sm font-semibold hover:bg-gray-700 transition-colors">닫기</button>
                <button id="saveBtn" class="px-4 py-2 bg-teal-500 text-white rounded-full text-sm font-semibold hover:bg-teal-600 transition-colors">저장하기</button>
            </div>
        </div>
    </div>
    
    <!-- Info Modal (initially hidden) -->
    <div id="infoModal" class="hidden fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
        <div class="bg-[#363a40] rounded-xl p-6 w-full max-w-sm shadow-2xl text-center">
            <p id="infoModalMessage" class="text-gray-100 text-base mb-4"></p>
            <button id="infoModalCloseBtn" class="px-4 py-2 bg-gray-600 text-gray-200 rounded-full text-sm font-semibold hover:bg-gray-700 transition-colors">확인</button>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const feedBtn = document.getElementById('feedBtn');
            const libraryBtn = document.getElementById('libraryBtn');
            const bookmarkBtn = document.getElementById('bookmarkBtn'); // Add bookmarkBtn reference
            const feedSection = document.getElementById('feedSection');
            const librarySection = document.getElementById('librarySection');
            const bookmarkSection = document.getElementById('bookmarkSection'); // Add bookmarkSection reference
            const bookmarkListContainer = document.getElementById('bookmarkList'); // Add bookmarkList reference
            const bookPostsSection = document.getElementById('bookPostsSection');
            const addQuoteBtn = document.getElementById('addQuoteBtn');
            const addQuoteModal = document.getElementById('addQuoteModal');
            const closeModalBtn = document.getElementById('closeModalBtn');
            const imageUpload = document.getElementById('imageUpload');
            const extractedText = document.getElementById('extractedText');
            const myThoughtTextarea = document.getElementById('myThought');
            const ocrLoading = document.getElementById('ocrLoading');
            const bookTitleInput = document.getElementById('bookTitle');
            const bookSearchResults = document.getElementById('bookSearchResults');
            const saveBtn = document.getElementById('saveBtn');
            const tagContainer = document.getElementById('tagContainer');
            const myTagsContainer = document.getElementById('myTagsContainer');
            const selectedTags = new Set();
            let selectedBook = { title: '', cover: '', authors: '' };
            let previousSection = '';
            
            const myProfile = {
                author: '김성민',
                initials: 'KS',
                company: '네이버',
                position: '쇼핑플랫폼기획',
                years: '15년차',
                profileColor: 'bg-purple-500'
            };
            const allPosts = []; // All posts data
            const myPosts = []; // Posts by "김성민"
            const bookStatuses = {}; // Tracks the status of each book: 'reading' or 'completed'
            const bookmarkedPosts = []; // Bookmarked posts data
            
            // Google Sheets 설정 (웹에 게시된 URL 사용)
            const PUBLISHED_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTaDpOm3Jfvi1ruEZ39H8aYzaoTp1KtJ3QV9gpGhIE0Ur_IBUO_dag2xFFcLZRvVGbmRN1EkR8ScXmO/pub?output=csv";

            // 대시보드 (내 서재 통계)를 업데이트하는 함수
            function updateDashboard() {
                const booksInLibrary = [...new Set(myPosts.map(post => post.bookTitle))];
                let readingCount = 0;
                let completedCount = 0;
                booksInLibrary.forEach(bookTitle => {
                    if (bookStatuses[bookTitle] === 'completed') {
                        completedCount++;
                    } else {
                        readingCount++;
                    }
                });
                document.getElementById('totalBooks').textContent = `📖 ${booksInLibrary.length}`;
                document.getElementById('readingBooks').textContent = `📚 ${readingCount}`;
                document.getElementById('completedBooks').textContent = `✅ ${completedCount}`;

                const allMyTags = new Set();
                myPosts.forEach(post => {
                    post.tags.forEach(tag => allMyTags.add(tag));
                });
                renderMyTags(allMyTags);
            }

            // 내 서재 태그를 렌더링하는 함수
            function renderMyTags(tags) {
                myTagsContainer.innerHTML = '';
                tags.forEach(tag => {
                    const tagElement = document.createElement('span');
                    tagElement.className = "bg-gray-700 text-gray-400 text-xs px-3 py-1 rounded-full cursor-pointer hover:bg-gray-600 transition-colors";
                    tagElement.textContent = `#${tag}`;
                    myTagsContainer.appendChild(tagElement);
                });
            }

            // 내 서재의 책 목록을 렌더링하는 함수
            function renderBookList() {
                const bookListContainer = document.getElementById('bookListContainer');
                bookListContainer.innerHTML = '';
                const bookGroups = myPosts.reduce((acc, post) => {
                    if (!acc[post.bookTitle]) {
                        acc[post.bookTitle] = { ...post, postCount: 0 };
                    }
                    acc[post.bookTitle].postCount++;
                    return acc;
                }, {});

                const uniqueBooks = Object.values(bookGroups);

                uniqueBooks.forEach(post => {
                    const bookCard = document.createElement('div');
                    bookCard.className = "book-card relative bg-[#363a40] rounded-xl shadow-md border border-gray-700 p-2 text-center cursor-pointer hover:bg-gray-700 transition-colors";
                    bookCard.dataset.title = post.bookTitle;
                    bookCard.innerHTML = `
                        <img src="${post.bookCover}" alt="${post.bookTitle} 표지" class="w-full h-auto rounded-md object-cover max-w-[80px] mx-auto">
                        <div class="text-xs font-semibold mt-2">${post.bookTitle}</div>
                        <div class="text-xs text-gray-400">${post.bookAuthors}</div>
                        <div class="text-xs text-gray-400 mt-1 flex items-center justify-center">
                            <span class="mr-1">📚</span>
                            <span>${post.postCount}개</span>
                        </div>
                    `;
                    bookCard.addEventListener('click', () => {
                        previousSection = 'library';
                        showFilteredPosts(post.bookTitle);
                    });
                    bookListContainer.appendChild(bookCard);
                });
            }

            // 특정 책의 포스트만 보여주는 함수
            function showFilteredPosts(bookTitle, authorName = myProfile.author) {
                feedSection.classList.add('hidden');
                librarySection.classList.add('hidden');
                bookPostsSection.classList.remove('hidden');
                bookmarkSection.classList.add('hidden');
                document.getElementById('profileDetailSection').classList.add('hidden');
                
                const filteredPosts = allPosts.filter(post => post.bookTitle === bookTitle && post.authorName === authorName);
                
                const bookDetailHeader = document.getElementById('bookDetailHeader');
                const bookInfo = filteredPosts[0];
                
                if (bookInfo) {
                    const currentStatus = bookStatuses[bookInfo.bookTitle] || 'reading';
                    bookDetailHeader.innerHTML = `
                        <div class="flex items-center space-x-4 mb-4">
                            <img src="${bookInfo.bookCover}" alt="${bookInfo.bookTitle} 표지" class="w-16 h-24 rounded-md object-cover">
                            <div class="flex flex-col">
                                <div class="text-lg font-bold text-gray-100">${bookInfo.bookTitle}</div>
                                <div class="text-sm text-gray-400">${bookInfo.bookAuthors}</div>
                                <div class="flex items-center space-x-2 mt-2">
                                    <button data-status="reading" class="status-btn text-xs font-semibold px-3 py-1 rounded-full ${currentStatus === 'reading' ? 'bg-teal-500 text-white' : 'bg-gray-700 text-gray-400'}">📚 읽는 중</button>
                                    <button data-status="completed" class="status-btn text-xs font-semibold px-3 py-1 rounded-full ${currentStatus === 'completed' ? 'bg-teal-500 text-white' : 'bg-gray-700 text-gray-400'}">✅ 완료</button>
                                </div>
                            </div>
                        </div>
                    `;
                    // Add status button listeners for the newly rendered buttons
                    document.querySelectorAll('.status-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            const newStatus = e.target.dataset.status;
                            bookStatuses[bookTitle] = newStatus;
                            updateDashboard();
                            document.querySelectorAll('.status-btn').forEach(b => {
                                b.classList.remove('bg-teal-500', 'text-white');
                                b.classList.add('bg-gray-700', 'text-gray-400');
                            });
                            e.target.classList.remove('bg-gray-700', 'text-gray-400');
                            e.target.classList.add('bg-teal-500', 'text-white');
                        });
                    });
                }
                
                const filteredPostsContainer = document.getElementById('filteredPostsContainer');
                filteredPostsContainer.innerHTML = ''; // Clear previous content
                filteredPosts.forEach(post => {
                    const postElement = createPostElement(post);
                    filteredPostsContainer.appendChild(postElement);
                });
            }
            
            // 북마크 목록을 렌더링하는 함수
            function renderBookmarks() {
                if (bookmarkedPosts.length === 0) {
                    bookmarkListContainer.innerHTML = `<div class="text-center text-gray-400">아직 북마크한 게시물이 없습니다.</div>`;
                } else {
                    bookmarkListContainer.innerHTML = '';
                    bookmarkedPosts.forEach(post => {
                        const postElement = createPostElement(post);
                        bookmarkListContainer.appendChild(postElement);
                    });
                }
            }

            // 프로필 상세 페이지를 보여주는 함수
            function showProfileDetail(authorName) {
                feedSection.classList.add('hidden');
                librarySection.classList.add('hidden');
                bookPostsSection.classList.add('hidden');
                bookmarkSection.classList.add('hidden');
                document.getElementById('profileDetailSection').classList.remove('hidden');
                previousSection = 'feed';

                const profileHeader = document.getElementById('profileHeader');
                const authorPosts = allPosts.filter(post => post.authorName === authorName);
                const authorInfo = authorPosts[0] || {};
                const profileImageUrl = authorInfo.profileImage || `https://placehold.co/80x80/6366f1/FFF?text=${(authorInfo.authorName || 'UN').substring(0, 2)}`;
                
                // 프로필 카드 HTML을 직접 조작
                const profileImageEl = document.getElementById('profileImage');
                const profileNameEl = document.getElementById('profileName');
                const profileDetailsEl = document.getElementById('profileDetails');
                const connectCountEl = document.getElementById('connectCount');
                
                profileImageEl.src = profileImageUrl;
                profileImageEl.alt = `${authorInfo.authorName} 프로필`;
                profileNameEl.textContent = authorInfo.authorName;
                profileDetailsEl.textContent = `${authorInfo.company} ${authorInfo.position} / ${authorInfo.role}`;
                connectCountEl.textContent = `Connecting: 322명`; // 더미 데이터

                // 태그 집계 및 렌더링
                const tagCounts = authorPosts.reduce((acc, post) => {
                    post.tags.forEach(tag => {
                        acc[tag] = (acc[tag] || 0) + 1;
                    });
                    return acc;
                }, {});

                const sortedTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]);
                const topTags = sortedTags.slice(0, 3);
                
                const profileTagsContainer = document.getElementById('profileTagsContainer');
                profileTagsContainer.innerHTML = '';
                topTags.forEach(tag => {
                    const tagElement = document.createElement('span');
                    tagElement.className = "bg-gray-700 text-gray-400 text-xs px-3 py-1 rounded-full";
                    tagElement.textContent = `#${tag}`;
                    profileTagsContainer.appendChild(tagElement);
                });


                const connectBtn = document.getElementById('connectBtn');
                connectBtn.textContent = 'Connect';
                connectBtn.classList.remove('bg-teal-500', 'hover:bg-teal-600');
                connectBtn.classList.add('bg-gray-700', 'hover:bg-gray-700');

                const profileBooksContainer = document.getElementById('profileBooksContainer');
                profileBooksContainer.innerHTML = '';
                const bookGroups = authorPosts.reduce((acc, post) => {
                    if (!acc[post.bookTitle]) {
                        acc[post.bookTitle] = { ...post, postCount: 0, bookCover: post.bookCover, bookAuthors: post.bookAuthors };
                    }
                    acc[post.bookTitle].postCount++;
                    return acc;
                }, {});

                const uniqueBooks = Object.values(bookGroups);
                uniqueBooks.forEach(post => {
                    const bookCard = document.createElement('div');
                    bookCard.className = "book-card relative bg-[#363a40] rounded-xl shadow-md border border-gray-700 p-2 text-center cursor-pointer hover:bg-gray-700 transition-colors";
                    bookCard.dataset.title = post.bookTitle;
                    bookCard.dataset.author = authorName;
                    bookCard.innerHTML = `
                        <img src="${post.bookCover}" alt="${post.bookTitle} 표지" class="w-full h-auto rounded-md object-cover max-w-[80px] mx-auto">
                        <div class="text-xs font-semibold mt-2">${post.bookTitle}</div>
                        <div class="text-xs text-gray-400">${post.bookAuthors}</div>
                        <div class="text-xs text-gray-400 mt-1 flex items-center justify-center">
                            <span class="mr-1">📚</span>
                            <span>${post.postCount}개</span>
                        </div>
                    `;
                    profileBooksContainer.appendChild(bookCard);
                });
            }

            // 섹션 전환 함수
            function showSection(sectionId) {
                feedSection.classList.add('hidden');
                librarySection.classList.add('hidden');
                bookPostsSection.classList.add('hidden');
                bookmarkSection.classList.add('hidden');
                document.getElementById('profileDetailSection').classList.add('hidden');
                document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('btn-active'));

                if (sectionId === 'feed') {
                    feedSection.classList.remove('hidden');
                    feedBtn.classList.add('btn-active');
                } else if (sectionId === 'library') {
                    librarySection.classList.remove('hidden');
                    libraryBtn.classList.add('btn-active');
                    renderBookList();
                    updateDashboard();
                } else if (sectionId === 'bookmark') {
                    bookmarkSection.classList.remove('hidden');
                    bookmarkBtn.classList.add('btn-active');
                    // showInfoModal('로그인 후 이용이 가능합니다.');
                }
            }

            feedBtn.addEventListener('click', () => showSection('feed'));
            libraryBtn.addEventListener('click', () => showSection('library'));
            bookmarkBtn.addEventListener('click', () => {
                showSection('bookmark');
                showInfoModal('로그인 후 이용이 가능합니다.');
            });
            
            // 스마트 뒤로가기 버튼
            document.getElementById('backBtn').addEventListener('click', () => {
                if (previousSection === 'library') {
                    showSection('library');
                } else if (previousSection === 'profile') {
                    const currentAuthor = document.getElementById('bookPostsSection').dataset.author;
                    showProfileDetail(currentAuthor);
                } else {
                    showSection('feed'); // Fallback to feed
                }
            });

            document.getElementById('backToFeedFromProfileBtn').addEventListener('click', () => showSection('feed'));
            
            addQuoteBtn.addEventListener('click', () => {
                addQuoteModal.classList.remove('hidden');
                extractedText.value = '';
                bookTitleInput.value = '';
                myThoughtTextarea.value = '';
                selectedTags.clear();
                document.querySelectorAll('.tag-pill').forEach(tag => tag.classList.remove('selected'));
                imageUpload.value = null;
                selectedBook = { title: '', cover: '', authors: '' };
                bookSearchResults.classList.add('hidden');
            });

            closeModalBtn.addEventListener('click', () => {
                addQuoteModal.classList.add('hidden');
            });

            addQuoteModal.addEventListener('click', (e) => {
                if (e.target.id === 'addQuoteModal') {
                    addQuoteModal.classList.add('hidden');
                }
            });
            
            function showInfoModal(message) {
                document.getElementById('infoModalMessage').textContent = message;
                document.getElementById('infoModal').classList.remove('hidden');
            }

            document.getElementById('infoModalCloseBtn').addEventListener('click', () => {
                document.getElementById('infoModal').classList.add('hidden');
            });


            // 이미지 업로드 및 OCR 기능
            imageUpload.addEventListener('change', async (event) => {
                const file = event.target.files[0];
                if (!file) return;

                ocrLoading.classList.remove('hidden');
                extractedText.value = '텍스트를 추출하는 중입니다... 잠시만 기다려 주세요.';

                const reader = new FileReader();
                reader.onload = async (e) => {
                    const base64Data = e.target.result.split(',')[1];
                    await extractTextFromImage(base64Data);
                    ocrLoading.classList.add('hidden');
                };
                reader.readAsDataURL(file);
            });

            // Gemini API를 사용해 이미지에서 텍스트 추출
            async function extractTextFromImage(base64Data) {
                const prompt = "Please extract only the underlined or highlighted text from this image. If no text is underlined or highlighted, please extract all the text. Return only the extracted text, nothing else. Translate the extracted text into Korean.";
                const apiKey = "";
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

                const payload = {
                    contents: [
                        {
                            role: "user",
                            parts: [
                                { text: prompt },
                                {
                                    inlineData: {
                                        mimeType: "image/jpeg",
                                        data: base64Data
                                    }
                                }
                            ]
                        }
                    ],
                };

                try {
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    
                    const result = await response.json();
                    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) {
                        extractedText.value = text;
                    } else {
                        extractedText.value = "텍스트를 추출하는 데 실패했습니다.";
                    }
                } catch (error) {
                    console.error('API 호출 중 오류 발생:', error);
                    extractedText.value = "오류가 발생했습니다. 다시 시도해 주세요.";
                }
            }

            // 책 검색 및 자동 완성
            let searchTimeout = null;
            bookTitleInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                const query = bookTitleInput.value.trim();
                if (query.length > 2) {
                    searchTimeout = setTimeout(() => {
                        searchBooks(query);
                    }, 500);
                } else {
                    bookSearchResults.classList.add('hidden');
                }
            });

            async function searchBooks(query) {
                const apiKey = ""; // API key will be provided at runtime
                const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5&langRestrict=ko&key=${apiKey}`;
                
                try {
                    const response = await fetch(apiUrl);
                    const data = await response.json();
                    displayBookResults(data.items);
                } catch (error) {
                    console.error('책 검색 중 오류 발생:', error);
                    bookSearchResults.classList.add('hidden');
                }
            }

            function displayBookResults(books) {
                bookSearchResults.innerHTML = '';
                if (books && books.length > 0) {
                    books.forEach(book => {
                        const volumeInfo = book.volumeInfo;
                        const title = volumeInfo.title || '제목 미상';
                        const authors = volumeInfo.authors ? volumeInfo.authors.join(', ') : '저자 미상';
                        const cover = volumeInfo.imageLinks?.thumbnail || 'https://placehold.co/80x120/555/FFF?text=Book';

                        const bookItem = document.createElement('div');
                        bookItem.className = 'autocomplete-item flex items-center p-2 border-b border-gray-600 last:border-b-0';
                        bookItem.innerHTML = `
                            <img src="${cover}" class="w-10 h-16 object-cover rounded-md mr-4">
                            <div>
                                <div class="font-semibold text-sm">${title}</div>
                                <div class="text-xs text-gray-400">${authors}</div>
                            </div>
                        `;
                        bookItem.dataset.title = title;
                        bookItem.dataset.cover = cover;
                        bookItem.dataset.authors = authors;
                        bookItem.addEventListener('click', () => {
                            selectedBook = { title: title, cover: cover, authors: authors };
                            bookTitleInput.value = title;
                            bookSearchResults.classList.add('hidden');
                        });
                        bookSearchResults.appendChild(bookItem);
                    });
                    bookSearchResults.classList.remove('hidden');
                } else {
                    bookSearchResults.classList.add('hidden');
                }
            }

            // 태그 선택 기능
            tagContainer.addEventListener('click', (e) => {
                const tagElement = e.target.closest('.tag-pill');
                if (tagElement) {
                    const tag = tagElement.dataset.tag;
                    if (selectedTags.has(tag)) {
                        selectedTags.delete(tag);
                        tagElement.classList.remove('selected');
                    } else {
                        selectedTags.add(tag);
                        tagElement.classList.add('selected');
                    }
                }
            });

            // 포스트 요소를 생성하는 함수
            function createPostElement(postData) {
                const newPost = document.createElement('div');
                newPost.className = "bg-[#363a40] p-4 rounded-xl shadow-md border border-gray-700";
                
                const tagsHtml = postData.tags.map(tag => 
                    `<span class="bg-gray-700 text-gray-400 text-xs px-2 py-0.5 rounded-full">#${tag}</span>`
                ).join(' ');

                const myThoughtHtml = postData.myThought && postData.myThought !== '-' ?
                    `<div class="mt-4 p-3 bg-gray-700 rounded-lg text-xs text-gray-100">
                        <span class="font-semibold text-gray-100">${postData.authorName}님의 한 줄 생각</span><br/>
                        ${postData.myThought}
                    </div>` : '';

                const isMyPost = postData.authorName === myProfile.author;
                const profileImage = postData.profileImage || `https://placehold.co/80x80/6366f1/FFF?text=${(postData.authorName || 'UN').substring(0, 2)}`;
                const profileLinkClass = isMyPost ? '' : 'cursor-pointer profile-link';

                newPost.innerHTML = `
                    <div class="flex items-center justify-between">
                        <div class="flex items-center ${profileLinkClass}" data-author="${postData.authorName}">
                            <img src="${profileImage}" alt="${postData.authorName} 프로필" class="w-8 h-8 rounded-full object-cover mr-2">
                            <div>
                                <div class="font-semibold text-gray-100 text-sm">${postData.authorName}</div>
                                <div class="text-xs text-gray-400">${postData.company} / ${postData.position} / ${postData.role}</div>
                            </div>
                        </div>
                        <button class="text-xl text-gray-400 hover:text-white transition-colors"> > </button>
                    </div>
                    <hr class="border-t border-gray-600 my-2">
                    <div class="flex items-start space-x-2 mb-3">
                        <img src="${postData.bookCover}" alt="${postData.bookTitle} 표지" class="w-12 h-18 rounded-md object-cover flex-shrink-0">
                        <div class="flex flex-col flex-grow">
                            <div class="text-xs font-semibold text-gray-100">${postData.bookTitle}</div>
                            <div class="text-xs text-gray-400 mt-1">출처: ${postData.bookAuthors}</div>
                        </div>
                    </div>
                    <blockquote class="text-gray-300 leading-snug text-sm mb-3 border-l-2 border-l-gray-500 pl-2">
                        "${postData.extractedText}"
                    </blockquote>
                    <div class="text-xs text-gray-400 text-right mt-2">${postData.date}</div>
                    ${myThoughtHtml}
                    <div class="flex space-x-2 mb-3 mt-3">
                        ${tagsHtml}
                    </div>
                    <div class="flex justify-between items-center text-xs text-gray-400 mt-3">
                        <div class="flex space-x-3">
                            <button class="flex items-center space-x-1 hover:text-red-400 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-heart">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                </svg>
                                <span>${postData.likes}</span>
                            </button>
                            <button class="comment-btn flex items-center space-x-1 hover:text-sky-400 transition-colors" data-post-id="${postData.id}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-message-square">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                                <span class="comment-count">${postData.comments.length}</span>
                            </button>
                            <button class="bookmark-btn flex items-center space-x-1 hover:text-yellow-400 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-bookmark">
                                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="comments-section mt-4 hidden">
                        <div class="comment-list space-y-2 text-sm">
                            ${postData.comments.map(comment => `
                                <div class="flex items-start space-x-2">
                                    <div class="w-6 h-6 rounded-full bg-orange-400 flex items-center justify-center text-white text-xs font-bold shrink-0">GM</div>
                                    <div>
                                        <div class="text-xs font-bold text-gray-200">사용자</div>
                                        <div class="text-sm text-gray-300">${comment}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="comment-input-area mt-4 flex items-center">
                            <input type="text" class="comment-input flex-grow rounded-full px-4 py-2 text-sm bg-gray-700 text-gray-200 border border-gray-600 focus:outline-none focus:border-teal-400" placeholder="댓글을 입력하세요...">
                            <button class="comment-submit-btn ml-2 px-4 py-2 bg-teal-500 text-white rounded-full text-sm font-semibold hover:bg-teal-600 transition-colors">등록</button>
                        </div>
                    </div>
                `;
                return newPost;
            }

            // Google Sheets에서 데이터를 가져와 포스트를 렌더링하는 함수
            async function fetchAndRenderPosts() {
                const loadingIndicator = document.getElementById('feedLoading');
                loadingIndicator.classList.remove('hidden');
                
                try {
                    const response = await fetch(PUBLISHED_SHEET_URL);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const csvText = await response.text();
                    
                    const postDataList = [];
                    const rows = csvText.split('\n');
                    
                    // 첫 번째 행은 헤더이므로 건너뛰고 나머지 데이터만 가져옵니다.
                    for (let i = 1; i < rows.length; i++) {
                        // CSV 필드 파싱을 위한 정규식 (따옴표로 묶인 필드 내의 쉼표를 처리)
                        const cells = rows[i].match(/(?:"[^"]*"|[^,])+/g);
                        
                        // 공백 행 스킵
                        if (!cells || cells.length < 1) {
                            continue;
                        }

                        try {
                            // CSV 필드의 따옴표를 제거하고 trim
                            const cleanCells = cells.map(cell => cell.replace(/^"(.*)"$/, '$1').trim());
                            
                            // A열(작성자)에 데이터가 없는 행은 건너뜁니다.
                            if (!cleanCells[0]) {
                                continue;
                            }

                            // 데이터 매핑: 사용자의 요청에 따라 각 열에 맞게 매핑합니다.
                            const postData = {
                                id: `post-${Date.now()}-${i}`,
                                authorName: cleanCells[0] || '이름 미상', // A열: 작성자
                                profileImage: cleanCells[1] || `https://placehold.co/80x80/6366f1/FFF?text=${(cleanCells[0] || 'UN').substring(0, 2)}`, // B열: 프로필 이미지
                                company: cleanCells[2] || '회사 미상', // C열: 회사명
                                position: cleanCells[3] || '포지션 미상', // D열: 포지션
                                role: cleanCells[4] || '하는 일 미상', // E열: 하는 일
                                bookTitle: cleanCells[5] || '제목 미상', // F열: 책이름
                                bookAuthors: cleanCells[6] || '저자 미상', // G열: 책 저자
                                bookCover: cleanCells[7] || 'https://placehold.co/80x120/555/FFF?text=Book', // H열: 책 이미지
                                extractedText: cleanCells[8] || '', // I열: 책 추출 문구
                                myThought: cleanCells[9] || '', // J열: 한줄 코멘트 (내 생각)
                                date: cleanCells[10] || new Date().toLocaleDateString('ko-KR'), // K열: 작성일자
                                tags: cleanCells[11]?.split(',').map(tag => tag.trim()).filter(tag => tag) || ['리더십'], // L열: 태그
                                likes: Math.floor(Math.random() * 200),
                                comments: [],
                                isMyPost: cleanCells[0] === myProfile.author
                            };
                            postDataList.push(postData);
                        } catch (e) {
                            console.error(`Error parsing row ${i+1}:`, e);
                            continue;
                        }
                    }
                    
                    console.log('Successfully fetched and parsed data:', postDataList);
                    processAndRender(postDataList);
                } catch (error) {
                    console.error("Error fetching data from published Google Sheets:", error);
                    document.getElementById('feedSection').innerHTML = '<div class="text-center text-red-400 p-8">데이터를 불러오는 데 실패했습니다. 다시 시도해 주세요.</div>';
                } finally {
                    loadingIndicator.classList.add('hidden');
                }
            }

            // 데이터를 처리하고 렌더링하는 함수
            function processAndRender(posts) {
                const feedSection = document.getElementById('feedSection');
                allPosts.length = 0;
                myPosts.length = 0;
                
                posts.forEach(postData => {
                    if (postData.isMyPost) {
                        myPosts.push(postData);
                    }
                    allPosts.push(postData);
                    const postElement = createPostElement(postData);
                    feedSection.appendChild(postElement);
                });

                updateDashboard();
            }

            // Save button functionality
            saveBtn.addEventListener('click', async () => {
                const newPostData = {
                    id: `post-${Date.now()}`,
                    bookTitle: selectedBook.title || '제목 미상',
                    bookAuthors: selectedBook.authors || '저자 미상',
                    bookCover: selectedBook.cover || 'https://placehold.co/80x120/555/FFF?text=Book',
                    extractedText: extractedText.value,
                    myThought: myThoughtTextarea.value,
                    tags: Array.from(selectedTags),
                    date: new Date().toLocaleDateString('ko-KR'),
                    likes: 0,
                    comments: [],
                    isMyPost: true,
                    authorName: myProfile.author,
                    profileImage: `https://placehold.co/80x80/9b59b6/FFF?text=${myProfile.initials}`,
                    company: myProfile.company,
                    position: myProfile.position,
                    role: myProfile.years
                };
                myPosts.unshift(newPostData);
                allPosts.unshift(newPostData);
                
                const newPostElement = createPostElement(newPostData);
                document.getElementById('feedSection').prepend(newPostElement);

                addQuoteModal.classList.add('hidden');
                updateDashboard();
            });

            // Comment button functionality
            document.addEventListener('click', (e) => {
                const commentBtn = e.target.closest('.comment-btn');
                if (commentBtn) {
                    const postId = commentBtn.dataset.postId;
                    const postElement = document.getElementById(postId);
                    if (postElement) {
                        const commentsSection = postElement.querySelector('.comments-section');
                        if (commentsSection) {
                            commentsSection.classList.toggle('hidden');
                        }
                    }
                }
            });

            // Comment submit functionality
            document.addEventListener('click', (e) => {
                const submitBtn = e.target.closest('.comment-submit-btn');
                if (submitBtn) {
                    const commentsSection = submitBtn.closest('.comments-section');
                    const commentInput = commentsSection.querySelector('.comment-input');
                    const commentText = commentInput.value.trim();
                    const commentList = commentsSection.querySelector('.comment-list');
                    const commentCountSpan = commentsSection.closest('.post').querySelector('.comment-count');
                    
                    if (commentText) {
                        const newComment = document.createElement('div');
                        newComment.className = "flex items-start space-x-2";
                        newComment.innerHTML = `
                            <div class="w-6 h-6 rounded-full bg-orange-400 flex items-center justify-center text-white text-xs font-bold shrink-0">GM</div>
                            <div>
                                <div class="text-xs font-bold text-gray-200">사용자</div>
                                <div class="text-sm text-gray-300">${commentText}</div>
                            </div>
                        `;
                        commentList.appendChild(newComment);
                        
                        commentInput.value = '';
                        commentCountSpan.textContent = parseInt(commentCountSpan.textContent) + 1;
                    }
                }
            });
            
            // Bookmark button functionality
            document.addEventListener('click', (e) => {
                const bookmarkBtn = e.target.closest('.bookmark-btn');
                if (bookmarkBtn) {
                    showInfoModal('로그인 후 사용가능합니다.');
                }
            });

            // "프로필 보기" 버튼 클릭 시 이벤트 리스너
            document.addEventListener('click', (e) => {
                const profileLink = e.target.closest('.profile-link');
                const profileBtn = e.target.closest('button');
                
                if (profileLink) {
                    const authorName = profileLink.dataset.author;
                    showProfileDetail(authorName);
                } else if (profileBtn && profileBtn.textContent.trim() === '>') {
                    const authorName = profileBtn.parentElement.querySelector('.profile-link').dataset.author;
                    showProfileDetail(authorName);
                }
            });

            // Connect button toggle functionality
            document.getElementById('profileDetailSection').addEventListener('click', (e) => {
                const connectBtn = e.target.closest('#connectBtn');
                if (connectBtn) {
                    if (connectBtn.textContent === 'Connect') {
                        connectBtn.textContent = 'Connecting';
                        connectBtn.classList.remove('bg-gray-700', 'hover:bg-gray-700');
                        connectBtn.classList.add('bg-teal-500', 'hover:bg-teal-600');
                    } else {
                        connectBtn.textContent = 'Connect';
                        connectBtn.classList.remove('bg-teal-500', 'hover:bg-teal-600');
                        connectBtn.classList.add('bg-gray-700', 'hover:bg-gray-700');
                    }
                }
            });

            // 프로필 페이지에서 책 클릭 시 필터링된 포스트 표시
            document.getElementById('profileBooksContainer').addEventListener('click', (e) => {
                const bookCard = e.target.closest('.book-card');
                if (bookCard) {
                    const bookTitle = bookCard.dataset.title;
                    const authorName = bookCard.dataset.author;
                    previousSection = 'profile'; // Set previous section to profile
                    document.getElementById('bookPostsSection').dataset.author = authorName; // Store author name for back button
                    showFilteredPosts(bookTitle, authorName); // Pass authorName to filter function
                }
            });
            
            // 앱 로드 시 피드 데이터 가져오기
            fetchAndRenderPosts();
        });
    </script>
</body>
</html>
