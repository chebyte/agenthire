import type { Agent } from '@/types'

export const DEMO_AGENTS: Agent[] = [
  {
    id: 1,
    owner: '0x1234567890abcdef1234567890abcdef12345678',
    metadataUri: 'ipfs://QmAgent1MetadataHash',
    reputationScore: 85,
    active: true,
    metadata: {
      name: 'MemeForge AI',
      avatar: '',
      description:
        'Specialized in viral meme generation and social media content. Leverages advanced image synthesis and trend analysis to create shareable content that resonates with target audiences.',
      specialty: 'Meme & Social Content',
      tags: ['memes', 'social-media', 'viral-content', 'image-gen'],
      endpointUrl: 'https://api.memeforge.ai/v1',
      evaluatorMode: 'auto',
      skills: [
        {
          name: 'Meme Generation',
          description: 'Creates viral memes from text prompts with style control',
          inputSchema: { prompt: 'string', style: 'string' },
          outputSchema: { imageUrl: 'string', caption: 'string' },
          pricingModel: '5 USDC per meme',
          sla: '< 2 minutes',
        },
        {
          name: 'Trend Analysis',
          description: 'Analyzes current social trends and recommends content angles',
          inputSchema: { topic: 'string', platform: 'string' },
          outputSchema: { trends: 'array', score: 'number' },
          pricingModel: '3 USDC per report',
          sla: '< 5 minutes',
        },
      ],
      stats: {
        successRate: 94,
        avgBid: 25,
        completedJobs: 142,
      },
    },
  },
  {
    id: 2,
    owner: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    metadataUri: 'ipfs://QmAgent2MetadataHash',
    reputationScore: 72,
    active: true,
    metadata: {
      name: 'CodeCraft Agent',
      avatar: '',
      description:
        'Full-stack smart contract and dApp development agent. Writes, audits, and deploys Solidity contracts with comprehensive test suites.',
      specialty: 'Smart Contract Development',
      tags: ['solidity', 'smart-contracts', 'auditing', 'dapps'],
      endpointUrl: 'https://api.codecraft.agent/v1',
      evaluatorMode: 'manual',
      skills: [
        {
          name: 'Contract Development',
          description: 'Writes production-ready Solidity smart contracts',
          inputSchema: { spec: 'string', standards: 'array' },
          outputSchema: { contractCode: 'string', abi: 'object' },
          pricingModel: '50 USDC per contract',
          sla: '< 30 minutes',
        },
        {
          name: 'Security Audit',
          description: 'Performs automated security analysis on smart contracts',
          inputSchema: { contractAddress: 'string' },
          outputSchema: { findings: 'array', riskLevel: 'string' },
          pricingModel: '30 USDC per audit',
          sla: '< 1 hour',
        },
        {
          name: 'Test Suite Generation',
          description: 'Generates comprehensive Hardhat/Foundry test suites',
          inputSchema: { contractCode: 'string', framework: 'string' },
          outputSchema: { tests: 'string', coverage: 'number' },
          pricingModel: '20 USDC per suite',
          sla: '< 20 minutes',
        },
      ],
      stats: {
        successRate: 88,
        avgBid: 65,
        completedJobs: 57,
      },
    },
  },
  {
    id: 3,
    owner: '0x9876543210fedcba9876543210fedcba98765432',
    metadataUri: 'ipfs://QmAgent3MetadataHash',
    reputationScore: 45,
    active: true,
    metadata: {
      name: 'DataPulse Bot',
      avatar: '',
      description:
        'On-chain data analytics and reporting agent. Monitors DeFi protocols, tracks wallet activity, and generates insights dashboards.',
      specialty: 'On-chain Analytics',
      tags: ['analytics', 'defi', 'dashboards', 'data'],
      endpointUrl: 'https://api.datapulse.bot/v1',
      evaluatorMode: 'auto',
      skills: [
        {
          name: 'Wallet Analysis',
          description: 'Deep analysis of wallet holdings, history, and patterns',
          inputSchema: { walletAddress: 'string', chains: 'array' },
          outputSchema: { report: 'object', riskScore: 'number' },
          pricingModel: '10 USDC per analysis',
          sla: '< 10 minutes',
        },
        {
          name: 'DeFi Dashboard',
          description: 'Generates protocol-specific analytics dashboards',
          inputSchema: { protocol: 'string', metrics: 'array' },
          outputSchema: { dashboardUrl: 'string', data: 'object' },
          pricingModel: '15 USDC per dashboard',
          sla: '< 15 minutes',
        },
      ],
      stats: {
        successRate: 76,
        avgBid: 18,
        completedJobs: 23,
      },
    },
  },
  {
    id: 4,
    owner: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
    metadataUri: 'ipfs://QmAgent4MetadataHash',
    reputationScore: 30,
    active: false,
    metadata: {
      name: 'DesignDroid',
      avatar: '',
      description:
        'AI-powered design agent for logos, brand kits, and UI mockups. Uses generative models to produce high-quality visual assets.',
      specialty: 'Design & Branding',
      tags: ['design', 'logos', 'branding', 'ui-mockups'],
      endpointUrl: 'https://api.designdroid.ai/v1',
      evaluatorMode: 'manual',
      skills: [
        {
          name: 'Logo Design',
          description: 'Creates custom logos from brand briefs',
          inputSchema: { brief: 'string', colorPalette: 'array' },
          outputSchema: { logoUrl: 'string', variants: 'array' },
          pricingModel: '15 USDC per logo',
          sla: '< 10 minutes',
        },
      ],
      stats: {
        successRate: 62,
        avgBid: 20,
        completedJobs: 8,
      },
    },
  },
]
