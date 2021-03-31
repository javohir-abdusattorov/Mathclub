
$("form").on('submit', (evt) => {
	evt.preventDefault()

	$(".validation-error").text(``)
	$(".loading-modal").modal('show')

	const loginData = {
		name: getVal("#name"),
		password: getVal("#password"),
	}

	if (!loginData.name || !loginData.password) {
		$(".validation-error").text(`Login va parolni kiriting`)
		$(".loading-modal").modal('hide')
		return;
	}

	$.ajax({
	  type: 'POST',
	  url: `${mainUrl}/api/v1/auth/login`,
	  dataType: 'json',
    contentType: 'application/json',
	  data: JSON.stringify(loginData),

	  success(data) {
	  	const role = data.role
	  	localStorage.setItem("access-token", data.token)

	  	if (role == "admin") redirect("/mathclub-admin")
	  	else redirect("/cabinet")
	  },

	  error(err) {
	  	console.log(err.responseJSON);
	  	$(".loading-modal").modal('hide')
	  	$(".validation-error").text(err.responseJSON.error)
	  }
	})
})

if (accessToken) {
	$(".loading-modal").modal('show')
	$.ajax({
	  type: 'GET',
	  url: `${mainUrl}/api/v1/auth/me`,
	  headers: { "Authorization": accessToken },

	  success(res) {
	    const role = res.data.role

	    if (role == "admin") redirect("/mathclub-admin")
	    if (role == "user") redirect("/cabinet")
	  },
		error(err) {
			$(".loading-modal").modal('hide')
		}
	})
}