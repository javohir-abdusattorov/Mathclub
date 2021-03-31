
$(".loading-modal").modal('show')
const elTopicsContainer = $(".topics")
const moduleID = getID()
let topics


const createTopics = (topics) => {
	elTopicsContainer.html(``)

  let i = 1
	for (const item of topics) {
		const moduleHtml = $(`
      <li class="list-group-item shadow d-flex flex-wrap justify-content-between align-items-center">
        <p class="col-12 col-md-9 px-0 mb-0 pointer text-center text-md-left"><span class="font-weight-500">${i}-mavzu.</span> ${item.name}</p>
        <div class="controls col-12 col-md-3 px-0 py-2 py-md-0 text-center text-md-right">
          <a href="${item.id}" class="btn btn-sm btn-outline-info">Darslar (${item.lessons.length})</a>
          <button class="btn btn-sm btn-outline-success" onclick="openEditModal('${item.id}')">Tahrirlash</button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteTopic('${item.id}')">O'chirish</button>
        </div>
      </li>
		`)

    i++
		elTopicsContainer.append(moduleHtml)
	}

	updateElWidth()
}

const createNewTopic = (data) => {
	$(".create-topic-form .validation-error").text(``)

  $.ajax({
    type: 'POST',
    url: `${mainUrl}/api/v1/modules/create-topic`,
    dataType: 'json',
    contentType: 'application/json',
    data,
    processData: false,
    contentType: false,
    headers: { "Authorization": accessToken },

    success(res) {
      $(".create-topic-form .validation-error").removeClass("text-danger").addClass("text-success").text("Mavzu muvaffaqiyatli yaratildi")
      $(".loading-modal").modal('hide')

      topics.push(res.data)
			createTopics(topics)

      setTimeout(() => {
      	$("#create-topic").modal('hide')
				$(".create-topic-form .validation-error").text(``)
      }, 2000)

		  $("#create-topic-name").val(``)
		  $("#create-topic-description").val(``)
      $("#create-topic-file").val(null)
      $(".custom-file-label").text("Pdf fayl yuklang")
    },

    error(err) {
      console.log(err.responseJSON)
      $(".loading-modal").modal('hide')
      $(".create-topic-form .validation-error").text(err.responseJSON.error)
    }
  })
}

const editTopic = (topicID, data) => {
	$(".edit-topic-form .validation-error").text(``)
	const i = topics.findIndex(item => item.id === topicID)

  $.ajax({
    type: 'PUT',
    url: `${mainUrl}/api/v1/modules/edit-topic`,
    dataType: 'json',
    contentType: 'application/json',
    data,
    processData: false,
    contentType: false,
    headers: { "Authorization": accessToken },

    success(res) {
      $(".edit-topic-form .validation-error").removeClass("text-danger").addClass("text-success").text("Mavzu muvaffaqiyatli saqlandi")
      $(".loading-modal").modal('hide')

      topics[i] = res.data
			createTopics(topics)

      $("#edit-topic-file").val(null)
      $(".custom-file-label").text("Pdf fayl yuklang")
      if (res.data.file) {
        $(".download-topic-file").show()
        $(".download-topic-file").attr("href", createTopicSrc(moduleID, res.data.id))
      }

      setTimeout(() => {
				$(".edit-topic-form .validation-error").text(``)
      }, 2000)
    },

    error(err) {
      console.log(err.responseJSON)
      $(".loading-modal").modal('hide')
      $(".edit-topic-form .validation-error").text(err.responseJSON.error)
    }
  })
}

const deleteTopic = (topicID) => {
  $(".loading-modal").modal('show')
	const i = topics.findIndex(item => item.id === topicID)

  $.ajax({
    type: 'PATCH',
    url: `${mainUrl}/api/v1/modules/delete-topic`,
    dataType: 'json',
    contentType: 'application/json',
    data: JSON.stringify({
      module: moduleID,
      topic: topicID
    }),
    headers: { "Authorization": accessToken },

    success(res) {
      topics.splice(i, 1)
			createTopics(topics)
      $(".loading-modal").modal('hide')
    },

    error(err) {
      console.log(err.responseJSON)
      $(".loading-modal").modal('hide')
    }
  })
}

const openEditModal = (topicID) => {
	const topic = topics.find(item => item.id === topicID)

	$(".edit-topic-form").attr("data-topic", topicID)
	$("#edit-topic-label").html(`Mavzu <span class="text-primary pointer underline">${topic.name}</span>'ni tahrirlash`)
	$("#edit-topic-name").val(topic.name)
	$("#edit-topic-description").val(topic.description)
  if (topic.file) {
    $(".download-topic-file").show()
    $(".download-topic-file").attr("href", createTopicSrc(moduleID, topicID))
  } else $(".download-topic-file").hide()

  $("#edit-topic").modal("show")
}

$(".create-topic-form").on("submit", (evt) => {
  evt.preventDefault()
  $(".loading-modal").modal('show')

  const data = {
    module: moduleID,
    name: getVal("#create-topic-name"),
    description: getVal("#create-topic-description"),
  }

  const formData = createFormData(data)
  if ($('#create-topic-file').val()) formData.append("file", $('#create-topic-file')[0].files[0])

  createNewTopic(formData)
})

$(".edit-topic-form").on("submit", (evt) => {
  evt.preventDefault()
  $(".loading-modal").modal('show')

  const topicID = $(".edit-topic-form").attr("data-topic")
  const data = {
    module: moduleID,
    topic: topicID,
    name: getVal("#edit-topic-name"),
    description: getVal("#edit-topic-description"),
  }

  const formData = createFormData(data)
  if ($("#edit-topic-file").val()) formData.append("file", $('#edit-topic-file')[0].files[0])

  editTopic(topicID, formData)
})


;(async () => {
	const module = await getModuleById(moduleID)
  if (!module) redirect('../')
  topics = module.topics
  
	createTopics(topics)
  $("h2 span").text(module.name)
	$(".loading-modal").modal('hide')
})()