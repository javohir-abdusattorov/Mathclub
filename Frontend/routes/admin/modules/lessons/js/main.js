
$(".loading-modal").modal('show')
const elLessonsContainer = $(".lessons")
const player = $("#lesson-video")
const currLocation = location.href.split('/')
const endID = currLocation.last().length ? 1 : 2
const topicID = currLocation[currLocation.length - endID]
const moduleID = currLocation[currLocation.length - endID - 1]
let lessons


const createLessons = (lessons) => {
	elLessonsContainer.html(``)

  let i = 1
	for (const item of lessons) {
		const html = $(`
      <li class="list-group-item shadow d-flex flex-wrap justify-content-between align-items-center">
        <p class="col-12 col-md-9 px-0 mb-0 pointer text-center text-md-left"><span class="font-weight-500">${i}-dars.</span> ${item.name}</p>
        <div class="controls col-12 col-md-3 px-0 py-2 py-md-0 text-center text-md-right">
          <button class="btn btn-sm btn-outline-success" onclick="openEditModal('${item.id}')">Tahrirlash</button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteLesson('${item.id}')">O'chirish</button>
        </div>
      </li>
		`)

    i++
		elLessonsContainer.append(html)
	}

	updateElWidth()
}

const createNewlesson = (data) => {
	$(".create-lesson-form .validation-error").text(``)

  $.ajax({
    type: 'POST',
    url: `${mainUrl}/api/v1/modules/create-lesson`,
    dataType: 'json',
    contentType: 'application/json',
    data,
    processData: false,
    contentType: false,
    headers: { "Authorization": accessToken },

    success(res) {
      $(".create-lesson-form .validation-error").removeClass("text-danger").addClass("text-success").text("Dars muvaffaqiyatli yaratildi")
      $(".loading-modal").modal('hide')

      lessons.push(res.data)
			createLessons(lessons)

      setTimeout(() => {
      	$("#create-lesson").modal('hide')
				$(".create-lesson-form .validation-error").text(``)
      }, 2000)

		  $("#create-lesson-name").val(``)
		  $("#create-lesson-description").val(``)
      $("#create-lesson-video").val(null)
      $(".custom-file-label").text("Video yuklang")
    },

    error(err) {
      console.log(err.responseJSON)
      $(".loading-modal").modal('hide')
      $(".create-lesson-form .validation-error").text(err.responseJSON.error)
    }
  })
}

const editLesson = (lessonID, data) => {
	$(".edit-lesson-form .validation-error").text(``)
	const i = lessons.findIndex(item => item.id === lessonID)

  $.ajax({
    type: 'PUT',
    url: `${mainUrl}/api/v1/modules/edit-lesson`,
    dataType: 'json',
    contentType: 'application/json',
    data,
    processData: false,
    contentType: false,
    headers: { "Authorization": accessToken },

    success(res) {
      $(".edit-lesson-form .validation-error").removeClass("text-danger").addClass("text-success").text("Dars muvaffaqiyatli saqlandi")

      lessons[i] = res.data
			createLessons(lessons)

      player.attr("src", createSrc(moduleID, topicID, lessonID))
      $("#edit-lesson-video").val(null)
      $(".custom-file-label").text("Video yuklang")
      $(".loading-modal").modal('hide')

      updateElWidth()
      setTimeout(() => $(".edit-lesson-form .validation-error").text(``), 3000)
    },

    error(err) {
      console.log(err.responseJSON)
      $(".loading-modal").modal('hide')
      $(".edit-lesson-form .validation-error").text(err.responseJSON.error)
    }
  })
}


const deleteLesson = (lessonID) => {
  $(".loading-modal").modal('show')
	const i = lessons.findIndex(item => item.id === lessonID)

  $.ajax({
    type: 'PATCH',
    url: `${mainUrl}/api/v1/modules/delete-lesson`,
    dataType: 'json',
    contentType: 'application/json',
    data: JSON.stringify({
      module: moduleID,
      topic: topicID,
      lesson: lessonID,
    }),
    headers: { "Authorization": accessToken },

    success(res) {
      lessons.splice(i, 1)
			createLessons(lessons)
      $(".loading-modal").modal('hide')
    },

    error(err) {
      console.log(err.responseJSON)
      $(".loading-modal").modal('hide')
    }
  })
}

const openEditModal = (lessonID) => {
	const lesson = lessons.find(item => item.id === lessonID)

  player.attr("src", createSrc(moduleID, topicID, lessonID))
	$("#edit-lesson").modal("show")
	$(".edit-lesson-form").attr("data-lesson", lessonID)
	$("#edit-lesson-label").html(`Dars <span class="text-primary pointer underline">${lesson.name}</span>'ni tahrirlash`)
	$("#edit-lesson-name").val(lesson.name)
	$("#edit-lesson-description").val(lesson.description)
}

$(".create-lesson-form").on("submit", (evt) => {
  evt.preventDefault()
  $(".loading-modal").modal('show')

  const data = {
    module: moduleID,
    topic: topicID,
    name: getVal("#create-lesson-name"),
    description: getVal("#create-lesson-description"),
  }

  const formData = createFormData(data)
  formData.append("video", $('#create-lesson-video')[0].files[0])

  createNewlesson(formData)
})

$(".edit-lesson-form").on("submit", async (evt) => {
  evt.preventDefault()
  $(".loading-modal").modal('show')

  const lessonID = $(".edit-lesson-form").data("lesson")
  const data = {
    module: moduleID,
    topic: topicID,
    lesson: lessonID,
    name: getVal("#edit-lesson-name"),
    description: getVal("#edit-lesson-description"),
  }

  const formData = createFormData(data)
  if ($("#edit-lesson-video").val()) formData.append("video", $('#edit-lesson-video')[0].files[0])

  editLesson(lessonID, formData)
})

$("#edit-lesson").on("hidden.bs.modal", (evt) => $(".edit-lesson-form .validation-error").text(``))


;(async () => {
	const module = await getModuleById(moduleID)
  if (!module) redirect('../')
  const topic = module.topics.find(item => item.id === topicID)
  if (!topic) redirect('../')
  lessons = topic.lessons
  
	createLessons(lessons)
  $("h3 span:first").text(module.name)
  $("h3 span:last").text(topic.name)
	$(".loading-modal").modal('hide')
})()