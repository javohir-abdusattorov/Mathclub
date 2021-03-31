
const moduleID = getID()
const elTopicsContainer = $("#topics")
const player = videojs('lesson-video')
let currentLesson = ``
let topics

const createModuleInfo = (module) => {
	$("h1").text(module.name)
	$("h3 span").text(`${module.price} so'm`)
	$(".module-description").text(module.description)
	elTopicsContainer.html(``)

	let i = 1
	for (const topic of module.topics) {
		const topicHtml = $(`
      <div class="card topic">
        <div class="bg-white text-left p-0">
          <p class="mb-0 py-2 pl-3 text-left font-weight-500 pointer" data-toggle="collapse" data-target="#collapse-${i}" aria-expanded="true" aria-controls="collapse-${i}">
            ${i}-mavzu. ${topic.name}
          </p>
        </div>
        <div id="collapse-${i}" class="collapse" data-parent="#topics">
          <ul class="list-unstyled mb-0 lessons"></ul>
        </div>
      </div>
		`)

		let j = 1
		const elLessonsContainer = topicHtml.find(".lessons")
		for (const lesson of topic.lessons) {
			const lessonHtml = $(`
        <li class="bg-dark text-white border-bottom py-2 pl-3 pointer d-flex lesson">
          <div w="90"><span class="font-weight-500">${j}-dars.</span> ${lesson.name}</div>
          <div w="14" class="center">
            <span class="rounded-circle border play-or-pause-icon">
              <svg class="bi d-block" width="20" height="20"><use xlink:href="/assets/icons/bootstrap-icons.svg#play"></svg>
            </span>
          </div>
          <span class="d-none data" data-topic="${topic.id}" data-lesson="${lesson.id}"></span>
        </li>
			`)
			elLessonsContainer.append(lessonHtml)
			j++
		}

		elTopicsContainer.append(topicHtml)
		i++
	}

	if (module.topics.length) {
		const firsTopic = elTopicsContainer.find(".topic:first > .collapse").addClass("show")
		playLesson(firsTopic.find("> .lessons > .lesson:first"))
	} else {
		$(".module-topics").html(`<div class="col-12"><h1 class="text-danger text-center">Bu modulda hozircha mavzular yo'q, iltimos kuting...</h1></div>`)
	}

	if (_user) {
		if (_user.role == "user") {
			if (_user.modules.some(item => item.module === moduleID)) {
				$(".buy-module-btn").attr("disabled", true).text(`Sotib olingan`)
			} else if (_user.buyingModules.some(item => item.module === moduleID)) {
				$(".buy-module-btn").attr("disabled", true).text(`Sotib olinmoqda`)
			}
		} else $(".buy-module-btn").attr("disabled", true).text(`Admin`)
	}

	updateElWidth()
}

const playLesson = (elLesson) => {
	const topicID = elLesson.find('.data').data("topic")
	const lessonID = elLesson.find('.data').data("lesson")
	const topicIndex = topics.findIndex(item => item.id === topicID)
	const lessonIndex = topics[topicIndex].lessons.findIndex(item => item.id === lessonID)
	const [currentTopicI, currentLessonI] = currentLesson.split('-').map(item => +item)
	const lesson = topics[topicIndex].lessons[lessonIndex]
	
	if (topicIndex === currentTopicI && lessonIndex === currentLessonI) return;
	currentLesson = `${topicIndex}-${lessonIndex}`

	player.src({ type: 'video/mp4', src: createSrc(moduleID, topicID, lessonID) })
	updateVideoElements()
	player.play()

	$(".play-or-pause-icon svg use").attr("xlink:href", "/assets/icons/bootstrap-icons.svg#play")
	elLesson.find(".play-or-pause-icon svg use").attr("xlink:href", "/assets/icons/bootstrap-icons.svg#pause")

	$(".current-lesson-info").html(`
		${lessonIndex+1}-dars. <span class="font-weight-500">${lesson.name}</span><br>
		<span class="text-muted">${lesson.description}</span>
	`)
	$(".current-topic-info").html(`
		${topicIndex+1}-dars. <span class="font-weight-500">${topics[topicIndex].name}</span><br>
		<span class="text-muted">${topics[topicIndex].description}</span>
	`)
	if (topics[topicIndex].file) {
		$(".topic-file").show()
		$(".topic-file").attr("href", createTopicSrc(moduleID, topics[topicIndex].id))
	} else $(".topic-file").hide()
}

const buyModule = () => {
	if (!_user) return redirect('/auth/login')
	if (_user.role == "user") {
		if (_user.buyingModules.some(item => item.module === moduleID)) return;
		else if (_user.modules.some(item => item.module === moduleID)) return;
	} else return;

	$(".loading-modal").modal('show')
  $.ajax({
    type: 'POST',
    url: `${mainUrl}/api/v1/modules/buy-module/${moduleID}`,
    headers: { "Authorization": accessToken },

    success(res) {
			$(".loading-modal").modal('hide')
			redirect(res.data)
    },

    error(err) {
    	console.error(JSON.stringify(error.responseJSON.error))
      $(".buy-module-btn").remove()
    	$(".loading-modal").modal('hide')
    }
  })
}


;(async () => {
	$(".loading-modal").modal('show')
	const [moduleDetail] = await getModule({ _id: moduleID })
	moduleDetail.topics = moduleDetail.topics.splice(0, 3)
	topics = moduleDetail.topics

	if (accessToken) {
		const result = await getMe(accessToken)
		if (result) _user = result
	}

	createModuleInfo(moduleDetail)
	for (const el of $(".lesson")) $(el).on("click", (evt) => playLesson($(el)))

	$(".loading-modal").modal('hide')
})()

updateVideoElements()