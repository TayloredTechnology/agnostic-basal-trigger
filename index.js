const functions = require('firebase-functions')
const http = require('http')
const fastifyCore = require('fastify')
const Octokit = require('@octokit/rest')
global.config = require('config')

const octokit = new Octokit({
	auth: `token ${config.auth}`
})

require('make-promises-safe')

let handleRequest = null

const serverFactory = handler => {
	handleRequest = handler
	return http.createServer()
}

const fastify = fastifyCore({serverFactory})

fastify.get('/', async (req, reply) => {
	const repo = {
		owner: 'sotekton',
		repo: 'agnostic-basal'
	}

	const date = new Date().toISOString()
	const {Base64} = require('js-base64')

	const getContents = await octokit.repos.getContents({
		...repo,
		path: 'rebuilt.txt'
	})

	reply.send(
		await octokit.repos.updateFile({
			...repo,
			path: 'rebuilt.txt',
			message: `cron trigger @ ${date}`,
			content: Base64.encode(date),
			sha: getContents.data.sha
		})
	)
})

exports.app = functions.https.onRequest((req, res) => {
	req = Object.assign({ip: ''}, {...req})
	fastify.ready(err => {
		if (err) throw err
		handleRequest(req, res)
	})
})
