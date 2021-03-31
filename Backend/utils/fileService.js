
const crypto = require('crypto')
const path = require('path')
const fs = require('fs')


module.exports = class FileService {

	uploadFile = async (file, uploadPath, getPath, fileName) => {
		file.name = `${fileName}${path.parse(file.name).ext}`
		const filePath = `${uploadPath}/${file.name}`
		const directPath = `${getPath}/${file.name}`

		await file.mv(filePath)
		return directPath
	}

	uploadLessonVideo = async (file, lessonID) => {
		const filePath = await this.uploadFile(file, "./public/courses", "courses", `lesson_${lessonID}_${crypto.randomBytes(24).toString('hex').slice(0, 24)}`)
		return filePath
	}

	uploadTopicFile = async (file, topicID) => {
		const filePath = await this.uploadFile(file, "./public/topic-files", "topic-files", `file_${topicID}_${crypto.randomBytes(24).toString('hex').slice(0, 24)}`)
		return filePath
	}

	uploadLandingVideo = async (file) => {
		const filePath = await this.uploadFile(file, "./public/landing-video", "", `video_${new Date().getTime()}`)
		return filePath
	}

	deleteFiles = (files) => {
		for (let filePath of files) {
			filePath = `./public/${filePath}`
			if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
		}
	}

}
