
$(".loading-modal").modal('show')


$.ajax({
  type: 'GET',
  url: `${mainUrl}/api/v1/auth/me`,
  headers: { "Authorization": accessToken },

  success(data) {
  	const role = data.data.role
    role == "admin" ? redirect("modules") : redirect("/")
  },

  error(err) {
    redirect("/")
  }
})
