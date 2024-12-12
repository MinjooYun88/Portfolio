
이 포트폴리오는 자동화 테스트 프로세스의 기본적인 샘플 구조 입니다. Puppeteer를 활용하여 웹 애플리케이션의 UI 테스트를 자동화하고 테스트 결과를 데이터베이스에 저장하거나 Jira와 연동하는 등 워크플로우를 포함하고 있습니다.
또한 API 스크립트를 통해 예상 데이터(Expected Data)를 가져오는 작업에 쉽게 적용될 수 있으며 Appium과의 연동을 통해 모바일 앱 크롤링 테스트로 확장할 수 있습니다.
본 자료는 개인적으로 제작된 포트폴리오로, 무단 복제 및 배포를 금지합니다.

* 전체 플로우차트
  Start → Read countries.json → Run tests → Save results → Save to DB → Check failed tests → Report to Jira → End
    1) Start: 프로세스 시작
    2) Read countries.json: 국가별 설정 파일 읽기
    3) Run tests: 각 국가에 대해 워커 스레드를 사용하여 테스트 병렬 실행
    4) Save result: 테스트 결과를 test_results.json 파일로 저장
    5) Save to DB: 테스트 결과를 DB에 저장 (TestExecution, TestDetails) 
    6) Check failed tests: Fail 결과 체크 
    7) Report to Jira: Fail 결과를 지라에 등록 
    8) End: 프로세스 종료 

* 각 파일에 대한 설명
  1) run_test.js
    전체 테스트 프로세스를 관리
    Worker Threads를 생성하여 병렬 테스트 수행
    테스트 결과 JSON 파일 저장 및 DB 호출
    실패한 테스트 케이스에 대한 Jira 등록
  
  2) countries.json
    테스트에 필요한 국가별 설정 제공
  
  4) worker_test.js
    Worker Thread에서 실행되는 스크립트
    국가 설정에 따라 common_home_test.js의 테스트 실행 및 결과 반환
  
  5) common_home_test.js
    Mocha 프레임워크를 사용하여 테스트 케이스 정의
    Puppeteer를 이용해 UI 테스트 케이스 검증 (Expected data 포함) 
  
  6) test_results.json
    테스트 실행 결과를 JSON 형식으로 저장
    데이터베이스 저장 및 Jira 통합에 활용
  
  7) db_handler.js
    테스트 결과를 MySQL 데이터베이스에 저장
    TestExecution, TestDetails 테이블에 데이터 기록
  
  8) jira_integration.js
    실패한 테스트 케이스를 Jira에 자동 등록
    Jira API를 이용해 버그 이슈 생성 및 상세 내용 기록
  
  9) generate_html_report.js
    데이터베이스에서 테스트 결과를 가져와 HTML 리포트를 생성

