
const elUsersContainer = $(".users")
const elUserModulesModal = $("#user-modules-modal")
const elGiveModuleModal = $("#give-modul-modal")
let users
let modules


const createUsers = (users) => {
	elUsersContainer.html(``)

  let i = 1
	for (const item of users) {
    const userModules = item.modules.map(item => item.module)
		const moduleHtml = $(`
      <li class="list-group-item shadow d-flex flex-wrap justify-content-between align-items-center">
        <p class="col-12 col-md-9 px-0 mb-0 pointer text-center text-md-left">
          ${i}. 
          ${item.name} - <span class="font-weight-500">${item.modules.length} ta modul</span>
          ${item.phoneNumber ? `<span class="ml-3">Telefon raqam: <span class="font-weight-500 underline">${beautifyPhoneNumber(item.phoneNumber)}</span></span>` : ''}
        </p>
        <div class="controls col-12 col-md-3 px-0 py-2 py-md-0 text-center text-md-right">
          <button class="btn btn-sm btn-outline-info" onclick="openModulesModal('${item._id}')">Modullar</button>
          <button class="btn btn-sm btn-outline-success" onclick="openGiveModal('${item._id}')">Modul berish +</button>
        </div>
      </li>
		`)

    if (!item.modules.length) moduleHtml.find(`button.btn-outline-info`).remove()
    const hasAllModules = modules.every(item => userModules.includes(item._id)) 
    if (hasAllModules) moduleHtml.find(`button.btn-outline-success`).remove()

		elUsersContainer.append(moduleHtml)
    i++
	}

	updateElWidth()
}

const createModules = (modules) => {
  const container = $("#give-module-module").html(`<option disabled selected>Tanlang</option>`)
  for (const module of modules) container.append(`<option value="${module._id}">${module.name}</option>`)
}

const createUserModules = (modules, userID) => {
  let i = 1
  const container = elUserModulesModal.find(".user-modules-container").html(``)
  for (const module of modules) {
    container.append(`
      <li class="list-group-item py-2 px-2 d-flex justify-content-between align-items-center">
        <p class="mb-0" w=80>${i}. <span class="font-weight-500">${module.name}</span></p>
        <span class="text-danger font-weight-bold p-0 pointer" style="font-size: 25px"
          data-toggle="tooltip" title="Modulni foydlanuvchidan olib tashlash"
          onclick="returnModule('${userID}', '${module.module}')">&times;</span>
      </li>
    `)
    i++
  }
  
  $('[data-toggle="tooltip"]').tooltip()
}

const openModulesModal = (userID) => {
  const user = users.find(item => item._id === userID)
  elUserModulesModal.find(".modal-title span").text(user.name)
  createUserModules(user.modules, userID)

  elUserModulesModal.modal("show")
}

const openGiveModal = (userID) => {
  const user = users.find(item => item._id === userID)
  const userModules = user.modules.map(item => item.module)
  const giveModules = modules.filter(item => !userModules.includes(item._id))

  createModules(giveModules)
  elGiveModuleModal.find(".modal-title span").text(user.name)
  elGiveModuleModal.find("form").attr("data-user", userID)

  elGiveModuleModal.modal("show")
}

const returnModule = (userID, moduleID) => {
  $(".loading-modal").modal('show')

  const i = users.findIndex(item => item._id === userID)
  const data = {
    module: moduleID,
    user: userID
  }

  $.ajax({
    type: 'POST',
    url: `${mainUrl}/api/v1/modules/return-module`,
    dataType: 'json',
    contentType: 'application/json',
    data: JSON.stringify(data),
    headers: { "Authorization": accessToken },

    success(res) {
      $(".loading-modal").modal('hide')

      users[i] = res.data
      createUsers(users)
      createUserModules(users[i].modules, users[i]._id)
    },

    error(err) {
      console.log(err.responseJSON)
      $(".loading-modal").modal('hide')
    }
  })
}

$(".give-module-form").on("submit", (evt) => {
  evt.preventDefault()
  $(".loading-modal").modal('show')
  elGiveModuleModal.find(".validation-error").text(``)

  const userID = $(".give-module-form").data("user")
  const i = users.findIndex(item => item._id === userID)
  const data = {
    module: getVal("#give-module-module"),
    user: userID
  }

  $.ajax({
    type: 'POST',
    url: `${mainUrl}/api/v1/modules/give-module`,
    dataType: 'json',
    contentType: 'application/json',
    data: JSON.stringify(data),
    headers: { "Authorization": accessToken },

    success(res) {
      $(".loading-modal").modal('hide')

      users[i] = res.data
      createUsers(users)

      elGiveModuleModal.modal("hide")
    },

    error(err) {
      console.log(err.responseJSON)
      elGiveModuleModal.find(".validation-error").text(err.responseJSON.error)
      $(".loading-modal").modal('hide')
    }
  })
})


;(async () => {
	$(".loading-modal").modal('show')
	users = await getUser({ sort: "createdAt" })
  modules = await getModule({ sort: "createdAt" })

  const me = users.findIndex(item => item.role === "admin")
  users.splice(me, 1)

	createUsers(users)
	$(".loading-modal").modal('hide')
})()