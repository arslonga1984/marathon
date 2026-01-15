# 배포 가이드

이 문서는 24주 마라톤 플래너를 웹에 배포하는 방법을 안내합니다.

## 사전 준비

1. **Firebase 프로젝트 생성** (무료)
2. **Vercel 계정** (무료)
3. **GitHub 계정** (선택사항, Vercel과 연동 시 필요)

## 1단계: Firebase 프로젝트 설정

### 1.1 Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com) 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: `marathon-planner`)
4. Google Analytics 설정 (선택사항)
5. 프로젝트 생성 완료

### 1.2 웹 앱 등록

1. Firebase Console > 프로젝트 설정 > 일반
2. "앱 추가" > 웹 앱 선택 (</> 아이콘)
3. 앱 닉네임 입력 (예: `Marathon Planner Web`)
4. "앱 등록" 클릭
5. **Firebase SDK 설정 값 복사** (나중에 사용)

### 1.3 Authentication 설정

1. Firebase Console > Authentication > Sign-in method
2. "Google" 제공업체 클릭
3. "사용 설정" 토글 활성화
4. 프로젝트 지원 이메일 선택 또는 입력
5. "저장" 클릭

### 1.4 Firestore 데이터베이스 생성

1. Firebase Console > Firestore Database
2. "데이터베이스 만들기" 클릭
3. **프로덕션 모드** 선택 (보안 규칙 설정 필요)
4. 위치 선택 (가장 가까운 리전, 예: `asia-northeast3` - 서울)
5. "사용 설정" 클릭

### 1.5 Firestore 보안 규칙 설정

Firebase Console > Firestore Database > 규칙 탭에서 다음 규칙 입력:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /userData/{userId} {
      // 사용자가 로그인했고 자신의 데이터만 접근 가능
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

"게시" 버튼 클릭

## 2단계: 로컬 환경 변수 설정

프로젝트 루트에 `.env` 파일 생성:

```env
VITE_FIREBASE_API_KEY=AIzaSy... (Firebase SDK에서 복사)
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

**주의**: `.env` 파일은 Git에 커밋하지 마세요! (이미 .gitignore에 포함됨)

## 3단계: 로컬 테스트

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속하여 Google 로그인이 정상 작동하는지 확인

## 4단계: Vercel 배포

### 4.1 Vercel 계정 생성

1. [Vercel](https://vercel.com) 접속
2. "Sign Up" 클릭
3. GitHub 계정으로 가입 (권장) 또는 이메일로 가입

### 4.2 프로젝트 배포

**방법 A: GitHub 연동 (권장)**

1. 프로젝트를 GitHub에 푸시:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-username/marathon-planner.git
   git push -u origin main
   ```

2. Vercel 대시보드 > "New Project" 클릭
3. GitHub 저장소 선택
4. 프로젝트 설정:
   - Framework Preset: **Vite**
   - Root Directory: `./` (기본값)
   - Build Command: `npm run build` (자동 감지됨)
   - Output Directory: `dist` (자동 감지됨)
5. Environment Variables 섹션에서 Firebase 환경 변수 추가:
   - `VITE_FIREBASE_API_KEY` = (Firebase에서 복사한 값)
   - `VITE_FIREBASE_AUTH_DOMAIN` = (Firebase에서 복사한 값)
   - `VITE_FIREBASE_PROJECT_ID` = (Firebase에서 복사한 값)
   - `VITE_FIREBASE_STORAGE_BUCKET` = (Firebase에서 복사한 값)
   - `VITE_FIREBASE_MESSAGING_SENDER_ID` = (Firebase에서 복사한 값)
   - `VITE_FIREBASE_APP_ID` = (Firebase에서 복사한 값)
6. "Deploy" 클릭

**방법 B: Vercel CLI 사용**

```bash
npm install -g vercel
vercel login
vercel
```

환경 변수는 Vercel 대시보드에서 추가하거나 `vercel env add` 명령어로 추가

### 4.3 Firebase 인증 도메인 추가

배포 완료 후 Vercel에서 제공하는 도메인을 Firebase에 추가:

1. Vercel 대시보드 > 프로젝트 > Settings > Domains에서 도메인 확인
   - 예: `marathon-planner.vercel.app`
2. Firebase Console > Authentication > Settings > 승인된 도메인
3. "도메인 추가" 클릭
4. Vercel 도메인 입력 (예: `marathon-planner.vercel.app`)
5. "추가" 클릭

**중요**: 이 단계를 건너뛰면 Google 로그인이 작동하지 않습니다!

## 5단계: 배포 확인

1. Vercel에서 제공하는 URL 접속
2. "Google로 로그인" 클릭
3. Google 계정으로 로그인
4. 훈련 기록 입력 및 저장 테스트
5. 다른 기기/브라우저에서 같은 계정으로 로그인하여 데이터 동기화 확인

## 문제 해결

### Google 로그인이 작동하지 않음

- Firebase Console > Authentication > Settings > 승인된 도메인에 Vercel 도메인이 추가되었는지 확인
- 환경 변수가 올바르게 설정되었는지 확인

### 데이터가 저장되지 않음

- Firestore 보안 규칙이 올바르게 설정되었는지 확인
- 브라우저 콘솔에서 에러 메시지 확인

### 빌드 실패

- Vercel 대시보드 > Deployments > 실패한 배포 > Logs 확인
- 환경 변수가 모두 설정되었는지 확인

## 추가 설정 (선택사항)

### 커스텀 도메인 설정

1. Vercel 대시보드 > 프로젝트 > Settings > Domains
2. 도메인 추가
3. DNS 설정 안내에 따라 도메인 제공업체에서 설정
4. Firebase Console > Authentication > Settings > 승인된 도메인에 커스텀 도메인 추가

### Firebase 무료 할당량

Firebase 무료 플랜(Spark)으로도 충분합니다:
- Authentication: 월 50,000명
- Firestore: 일 50,000 읽기, 20,000 쓰기

대부분의 개인 사용자에게는 무료 플랜으로 충분합니다.
