
let config
const elLandingForm = $(".config-form")
const elUserForm = $(".settings-form")

$(".loading-modal").modal('show')
$.ajax({
  type: 'GET',
  url: `${mainUrl}/api/v1/auth/me`,
  headers: { "Authorization": accessToken },

  success(res) {
    auth(res)
    createUserData(res.data)
    $(".loading-modal").modal('hide')
  },

  error(err) {
    console.error(err)
  }
})


$.ajax({
  type: 'GET',
  url: `${mainUrl}/api/v1/config/get`,

  success(res) {
    console.log(res)
    config = res.landing
    createLandingData(res.landing)
  },

  error(err) {
    console.error(err)
  }
})

const createToggleData = () => {
  elLandingForm.find("#landing-video-toggle").attr("checked", config.video.isVisible)
  elLandingForm.find(".landing-video-toggle-text").toggleClass("text-success", config.video.isVisible)
  elLandingForm.find(".landing-video-toggle-text").toggleClass("text-danger", !config.video.isVisible)

  elLandingForm.find("#landing-text-toggle").attr("checked", config.text.isVisible)
  elLandingForm.find(".landing-text-toggle-text").toggleClass("text-success", config.text.isVisible)
  elLandingForm.find(".landing-text-toggle-text").toggleClass("text-danger", !config.text.isVisible)
}

const createLandingData = () => {
  createToggleData()
  elLandingForm.find("#landing-text").val(config.text.text)
}

const toggleVideoVisible = () => {
  config.video.isVisible = !config.video.isVisible
  createToggleData()
}

const toggleTextVisible = () => {
  config.text.isVisible = !config.text.isVisible
  createToggleData()
}

const createUserData = (user) => {
  elUserForm.find("#name").val(user.name)
  elUserForm.find("#old-password").val(``)
  elUserForm.find("#new-password").val(``)
  $(".user-account h6").text(user.name)

  _user = user
}

elUserForm.on("submit", (evt) => {
  evt.preventDefault()
  elUserForm.find(".validation-error").text(``)
  $(".loading-modal").modal('show')

  const oldPsw = getVal(`#old-password`)
  const newPsw = getVal(`#new-password`)
  const data = new FormData()

  if (getVal(`#name`) != _user.name) data.append("name", getVal(`#name`))

  if (oldPsw && newPsw) {
    data.append("oldPassword", oldPsw)
    data.append("newPassword", newPsw)
  } else if ((!oldPsw && newPsw) || (!newPsw && oldPsw)) {
    $(".warnings").text(`Agar parollardan biri bo'lib biri bo'lmagan holatda parol yangilanmaydi! Parolni yangilash uchun ikkala parolni kiriting!`)
  }

  $.ajax({
    type: 'PUT',
    url: `${mainUrl}/api/v1/users/edit`,
    dataType: 'json',
    contentType: 'application/json',
    data,
    processData: false,
    contentType: false,
    headers: { "Authorization": accessToken },

    success(res) {
      elUserForm.find(".validation-error").removeClass("text-danger").addClass("text-success").text("Sozlamalar muvaffaqiyatli saqlandi")
      createUserData(res.data)
      $(".loading-modal").modal('hide')
    },

    error(err) {
      console.log(err.responseJSON)
      $(".loading-modal").modal('hide')
      elUserForm.find(".validation-error").text(err.responseJSON.error)
    }
  })
})


elLandingForm.on("submit", (evt) => {
  evt.preventDefault()
  elLandingForm.find(".validation-error").text(``)
  $(".loading-modal").modal('show')

  const data = new FormData()
  data.append("video.isVisible", config.video.isVisible)
  data.append("text.isVisible", config.text.isVisible)
  data.append("text.text", $("#landing-text").val())
  if ($("#landing-video").val()) data.append("video.video", $("#landing-video")[0].files[0])

  $.ajax({
    type: 'PUT',
    url: `${mainUrl}/api/v1/config/edit`,
    dataType: 'json',
    contentType: 'application/json',
    data,
    processData: false,
    contentType: false,
    headers: { "Authorization": accessToken },

    success(res) {
      elLandingForm.find(".validation-error").removeClass("text-danger").addClass("text-success").text("Sozlamalar muvaffaqiyatli saqlandi")
      console.log(res.data)
      config = res.data.landing
      createLandingData()
      $(".loading-modal").modal('hide')
    },

    error(err) {
      console.log(err.responseJSON)
      $(".loading-modal").modal('hide')
      elLandingForm.find(".validation-error").text(err.responseJSON.error)
    }
  })
})