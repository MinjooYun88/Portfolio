import mysql from 'mysql2/promise';

// MySQL 연결 설정
const dbConfig = {
    host: 'localhost',
    user: 'test_user',
    password: '0404',
    database: 'TestResults',
};

// 테스트 결과를 데이터베이스에 저장
export async function saveTestResultsToDatabase(testResults) {
    const connection = await mysql.createConnection(dbConfig);
    let setNumber = 1; // 초기 세트 번호
    let lastCountry = null; // 이전 국가를 추적하여 세트 변경 감지
    try {
        // 트랜잭션 시작
        await connection.beginTransaction();

        for (const result of testResults) {
            // 국가가 변경되면 세트 번호 증가
            if (result.country !== lastCountry) {
                setNumber++;  // 새로운 국가를 만나면 세트 번호 증가
                lastCountry = result.country; // 국가 업데이트
            }

            // 데이터 삽입
            const now = new Date();
            const testSetId = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}_${result.country}`;

            await connection.execute(
                `INSERT INTO TestExecution (execution_id, execution_date, country, status, total_tests, passed_tests, failed_tests, TestSet)
                 VALUES (NULL, NOW(), ?, ?, ?, ?, ?, ?)`,
                [result.country, result.status, result.total, result.passed, result.failed, testSetId]
            );
            
            for (const detail of result.details) {
                await connection.execute(
                    `INSERT INTO TestDetails (TestSet, test_case, status, error_message)
                     VALUES (?, ?, ?, ?)`,
                    [testSetId, detail.testCase, detail.status, detail.error || null]
                );
            }
        }

        // 트랜잭션 커밋
        await connection.commit();
        console.log('Test results successfully saved to the database.');
    } catch (error) {
        // 트랜잭션 롤백
        await connection.rollback();
        console.error('Failed to save test results to the database:', error.message);
    } finally {
        await connection.end();
    }
}
