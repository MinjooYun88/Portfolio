import fs from 'fs';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Jira 설정
const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_USER_EMAIL = process.env.JIRA_USER_EMAIL;

export async function reportToJira(testResultsPath) {
    try {
        // test_results.json 파일 읽기
        const testResults = JSON.parse(await fs.promises.readFile(testResultsPath, 'utf8'));

        for (const result of testResults) {
            if (result.status === 'failed') {
                // ADF 형식으로 오류 메시지 작성
                const adfContent = result.details
                    .filter((detail) => detail.status === 'failed' && detail.error)
                    .map((detail) => ({
                        type: 'paragraph',
                        content: [
                            { type: 'text', text: `Test Case: ${detail.testCase}` },
                            { type: 'text', text: `\nError: ${detail.error}` },
                        ],
                    }));

                // descriptionADF에 ADF 형식 추가
                const descriptionADF = {
                    type: 'doc',
                    version: 1,
                    content: [
                        {
                            type: 'heading',
                            attrs: { level: 1 },
                            content: [{ type: 'text', text: `Test Failed for ${result.country}` }],
                        },
                        ...adfContent, // ADF 콘텐츠 추가
                    ],
                };

                // Jira 이슈 데이터
                const issueData = {
                    fields: {
                        project: { key: JIRA_PROJECT_KEY },
                        summary: `Test Failed: ${result.country}`,
                        description: descriptionADF, // ADF 형식으로 설정
                        issuetype: { name: 'Bug' },
                        labels: [result.country], // 국가 라벨 추가
                    },
                };

                // 데이터 검증
                console.log('Jira Issue Data:', JSON.stringify(issueData, null, 2));

                // Jira API 호출
                const response = await axios.post(
                    `${JIRA_BASE_URL}/rest/api/3/issue`,
                    issueData,
                    {
                        headers: {
                            Authorization: `Basic ${Buffer.from(`${JIRA_USER_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                console.log(`Jira issue created for ${result.country}: ${response.data.key}`);
            }
        }
    } catch (error) {
        console.error('Failed to create Jira issue:', error.response?.data || error.message);
    }
}
