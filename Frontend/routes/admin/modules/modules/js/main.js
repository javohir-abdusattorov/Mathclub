
const elModulesContainer = $(".modules")
let modules


const createModules = (modules) => {
	elModulesContainer.html(``)

	for (const item of modules) {
		const moduleHtml = $(`
      <li class="list-group-item d-flex flex-wrap justify-content-between align-items-center">
        <p class="col-12 col-md-9 px-0 mb-0 pointer text-center text-md-left">
          ${item.type == "applicants" ? `
            <span class="font-weight-500 text-primary">A)</span>
          ` : `
            <span class="font-weight-500 text-success">B)</span>
          `}
          ${item.name} 
          <span class="font-weight-500 mx-3">${item.price} so'm</span>
          <span class="text-primary font-weight-500">${item.sold} marta sotilgan</span>
        </p>
        <div class="controls col-12 col-md-3 px-0 py-2 py-md-0 text-center text-md-right">
          <a href="${item._id}" class="btn btn-sm btn-outline-info">Mavzular (${item.topics.length})</a>
          <button class="btn btn-sm btn-outline-success" onclick="openEditModal('${item._id}')">Tahrirlash</button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteModule('${item._id}')">O'chirish</button>
        </div>
      </li>
		`)

		elModulesContainer.append(moduleHtml)
	}

	updateElWidth()
}

const createNewModule = (data) => {
	$(".create-module-form .validation-error").text(``)

  $.ajax({
    type: 'POST',
    url: `${mainUrl}/api/v1/modules/create`,
    dataType: 'json',
    contentType: 'application/json',
    data: JSON.stringify(data),
    headers: { "Authorization": accessToken },

    success(res) {
      $(".create-module-form .validation-error").removeClass("text-danger").addClass("text-success").text("Modul muvaffaqiyatli yaratildi")
      $(".loading-modal").modal('hide')

      modules.push(res.data)
      modules = modules.sort((a, b) => a.type.localeCompare(b.type))
			createModules(modules)

      setTimeout(() => {
      	$("#create-module").modal('hide')
				$(".create-module-form .validation-error").text(``)
      }, 2000)

		  $("#create-module-name").val(``)
		  $("#create-module-price").val(``)
		  $("#create-module-description").val(``)
    },

    error(err) {
      console.log(err.responseJSON)
      $(".loading-modal").modal('hide')
      $(".create-module-form .validation-error").text(err.responseJSON.error)
    }
  })
}

const editModule = (moduleID, data) => {
	$(".edit-module-form .validation-error").text(``)
	const i = modules.findIndex(item => item._id === moduleID)

  $.ajax({
    type: 'PUT',
    url: `${mainUrl}/api/v1/modules/edit/${moduleID}`,
    dataType: 'json',
    contentType: 'application/json',
    data: JSON.stringify(data),
    headers: { "Authorization": accessToken },

    success(res) {
      $(".edit-module-form .validation-error").removeClass("text-danger").addClass("text-success").text("Modul muvaffaqiyatli saqlandi")
      $(".loading-modal").modal('hide')

      modules[i] = res.data
      modules = modules.sort((a, b) => a.type.localeCompare(b.type))
			createModules(modules)
      setTimeout(() => {
      	$("#edit-module").modal('hide')
				$(".edit-module-form .validation-error").text(``)
      }, 2000)
    },

    error(err) {
      console.log(err.responseJSON)
      $(".loading-modal").modal('hide')
      $(".edit-module-form .validation-error").text(err.responseJSON.error)
    }
  })
}

const deleteModule = (moduleID) => {
  $(".loading-modal").modal('show')
	const i = modules.findIndex(item => item._id === moduleID)

  $.ajax({
    type: 'PATCH',
    url: `${mainUrl}/api/v1/modules/delete/${moduleID}`,
    headers: { "Authorization": accessToken },

    success(res) {
      modules.splice(i, 1)
			createModules(modules)
      $(".loading-modal").modal('hide')
    },

    error(err) {
      console.log(err.responseJSON)
      $(".loading-modal").modal('hide')
    }
  })
}

const openEditModal = (moduleID) => {
	const module = modules.find(item => item._id === moduleID)

	$("#edit-module").modal("show")
	$(".edit-module-form").attr("data-module", moduleID)
	$("#edit-module-label").html(`Modul <span class="text-primary pointer underline">${module.name}</span>'ni tahrirlash`)
	$("#edit-module-name").val(module.name)
	$("#edit-module-price").val(module.price)
  $("#edit-module-type").val(module.type)
	$("#edit-module-description").val(module.description)
}

$(".create-module-form").on("submit", (evt) => {
  evt.preventDefault()
  $(".loading-modal").modal('show')

  const data = {
    name: getVal("#create-module-name"),
    type: getVal("#create-module-type"),
    price: +getVal("#create-module-price"),
    description: getVal("#create-module-description"),
  }

  createNewModule(data)
})

$(".edit-module-form").on("submit", (evt) => {
  evt.preventDefault()
  $(".loading-modal").modal('show')

  const moduleID = $(".edit-module-form").attr("data-module")
  const data = {
    name: getVal("#edit-module-name"),
    type: getVal("#edit-module-type"),
    price: +getVal("#edit-module-price"),
    description: getVal("#edit-module-description"),
  }

  editModule(moduleID, data)
})


;(async () => {
	$(".loading-modal").modal('show')
	modules = await getModule({ sort: "createdAt" })
  modules = modules.sort((a, b) => a.type.localeCompare(b.type))
	createModules(modules)
	$(".loading-modal").modal('hide')
})()