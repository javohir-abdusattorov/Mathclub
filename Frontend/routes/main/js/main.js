
let authorized = false
let modules
const landingVideo = videojs('landing-video')

const elApplicantsModulesContainer = $(".applicants-modules")
const elStudentModulesContainer = $(".students-modules")

const createModules = (modules) => {
	elApplicantsModulesContainer.html(``)
	elStudentModulesContainer.html(``)

	for (const item of modules) {
		const allLessonsNum = item.topics.reduce((acc, element) => acc + element.lessons.length, 0)

		const moduleHtml = $(`
	    <div class="col-11 col-md-4 mb-5">
	      <div class="card px-0 text-center shadow" h=100>
	        <div class="card-header bg-primary text-light">
	          <h4 class="my-0 font-weight-normal">${item.name}</h4>
	        </div>
	        <div class="card-body px-2">
	          <p class="px-3">${item.description}</p>
	          <ul class="list-unstyled mt-3 mb-4 font-weight-500">
	            <li>${item.topics.length} ta mavzu ✔️</li>
	            <li>${allLessonsNum} ta video ✔️</li>
	            <li>3 ta bepul mavzu ✔️</li>
	          </ul>

	          <p class="pointer font-weight-bold mb-0" onclick="$(this).parent().find('.topics-list').toggle(200)">Mavzular ro'yxati</p>
	          <ol class="text-left mt-1 mb-4 pl-4 font-weight-500 topics-list" style="display: none"></ol>

	          <div class="controls mt-4">
		          <a href="module/preview/${item._id}" class="btn d-block mx-auto btn-outline-info mt-2" w=80>Bepul dars</a>
	          </div>
	        </div>
	      </div>
	    </div>
		`)

		const topicsContainer = moduleHtml.find(".topics-list")
		for (const topic of item.topics) topicsContainer.append(`<li>${topic.name} - ${topic.lessons.length}ta dars</li>`)

		if (_user && _user.role == "user") {
			if (_user.modules.some(obj => obj.module === item._id)) {
				moduleHtml.find(".controls").html(`<a href="/cabinet/modules/${item._id}" class="btn d-block mx-auto btn-success mt-2" w=80>Ko'rish</a>`)
			}
			$(".login-link").attr("href", "/cabinet/modules/")
		} else if (_user && _user.role == "admin") $(".login-link").attr("href", "/mathclub-admin/modules/")

		if (item.type == "applicants") elApplicantsModulesContainer.append(moduleHtml)
			else elStudentModulesContainer.append(moduleHtml)
	}

	updateElWidth()
}

const createLandingInfo = (config) => {
	if (!config.video.isVisible) $("#landing-video").hide()
	if (!config.text.isVisible) $("#landing-text").hide()

	$("#landing-text").text(config.text.text)
	landingVideo.src({ type: 'video/mp4', src: `${mainUrl}/${config.video.video}` })
}


;(async () => {
	$(".loading-modal").modal('show')
	const allModules = await getModule({ sort: "createdAt" })
	const config = await $.ajax({
    type: 'GET',
    url: `${mainUrl}/api/v1/config/get`,
  })


	if (accessToken) {
		const result = await getMe(accessToken)
		if (result) _user = result
	}

  createLandingInfo(config.landing)
	createModules(allModules)
	$(".loading-modal").modal('hide')
})()