
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

const elUserForm = $(".settings-form")
const createUserData = (user) => {
  elUserForm.find("#name").val(user.name)
  elUserForm.find("#old-password").val(``)
  elUserForm.find("#new-password").val(``)
  elUserForm.find("#phone-number").val(user.phoneNumber)
  $(".user-account h6").text(user.name)

  _user = user
}

elUserForm.on("submit", (evt) => {
  evt.preventDefault()
  $(".validation-error").text(``)
  $(".loading-modal").modal('show')

  const oldPsw = getVal(`#old-password`)
  const newPsw = getVal(`#new-password`)
  const data = new FormData()

  if (getVal(`#name`) != _user.name) data.append("name", getVal(`#name`))
  if (getVal(`#phone-number`) != _user.phoneNumber) data.append("phoneNumber", getVal(`#phone-number`))

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
      $(".validation-error").removeClass("text-danger").addClass("text-success").text("Sozlamalar muvaffaqiyatli saqlandi")
      createUserData(res.data)
      $(".loading-modal").modal('hide')
    },

    error(err) {
      console.log(err.responseJSON)
      $(".loading-modal").modal('hide')
      $(".validation-error").text(err.responseJSON.error)
    }
  })
})