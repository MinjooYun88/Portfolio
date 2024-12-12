import mysql from 'mysql2/promise';
import fs from 'fs/promises';

// MySQL 연결 설정
const dbConfig = {
    host: 'localhost',
    user: 'test_user',
    password: '0404',
    database: 'TestResults',
};

// HTML 파일 생성 함수
async function generateHtmlReport() {
    const connection = await mysql.createConnection(dbConfig);

    try {
        // TestExecution 데이터 가져오기
        const [executionRows] = await connection.query('SELECT * FROM TestExecution');

        // TestDetails 데이터 가져오기
        const [detailsRows] = await connection.query('SELECT * FROM TestDetails');

        // HTML 내용 생성
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Test Results Report</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    table, th, td {
                        border: 1px solid black;
                    }
                    th, td {
                        padding: 10px;
                        text-align: left;
                    }
                    th {
                        background-color: #f4f4f4;
                    }
                </style>
            </head>
            <body>
                <h1>Test Results Report</h1>
                
                <h2>TestExecution Table</h2>
                <table>
                    <thead>
                        <tr>
                            <th>TestSet</th>
                            <th>Country</th>
                            <th>Status</th>
                            <th>Total Tests</th>
                            <th>Passed Tests</th>
                            <th>Failed Tests</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${executionRows
                            .map(
                                (row) => `
                                <tr>
                                    <td>${row.TestSet}</td>
                                    <td>${row.country}</td>
                                    <td>${row.status}</td>
                                    <td>${row.total_tests}</td>
                                    <td>${row.passed_tests}</td>
                                    <td>${row.failed_tests}</td>
                                </tr>
                            `
                            )
                            .join('')}
                    </tbody>
                </table>

                <h2>TestDetails Table</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Test Set</th>
                            <th>Test Case</th>
                            <th>Status</th>
                            <th>Error Message</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${detailsRows
                            .map(
                                (row) => `
                                <tr>
                                    <td>${row.TestSet}</td>
                                    <td>${row.test_case}</td>
                                    <td>${row.status}</td>
                                    <td>${row.error_message || ''}</td>
                                </tr>
                            `
                            )
                            .join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        // HTML 파일 저장
        await fs.writeFile('./test_results_report.html', htmlContent, 'utf8');
        console.log('HTML report generated: test_results_report.html');
    } catch (error) {
        console.error('Failed to generate HTML report:', error.message);
    } finally {
        await connection.end();
    }
}

// 실행
generateHtmlReport();
