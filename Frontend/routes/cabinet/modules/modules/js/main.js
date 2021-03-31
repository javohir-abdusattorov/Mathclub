
const elModulesContainer = $(".modules")
const elBuyingModules = $(".buying-modules-container")
const elBuyingModulesContainer = $(".buying-modules-container > ul")
let modules


const createModules = (modules) => {
	elModulesContainer.html(``)
  if (!modules.length) return $("body").append(`<h3 class="mt-4 text-danger text-center">Sizda bironta ham modul yo'q</h3>`)

  let i = 1
	for (const item of modules) {
    const allLessonsNum = item.topics.reduce((acc, element) => acc + element.lessons.length, 0)
		const moduleHtml = $(`
      <li class="list-group-item d-flex justify-content-between align-items-center">
        <a class="text-decoration-none text-dark" href="${item._id}">
          ${item.type == "applicants" ? `
            <span class="font-weight-500 text-primary">A)</span>
          ` : `
            <span class="font-weight-500 text-success">B)</span>
          `}

          ${item.name}
          <span class="font-weight-500 ml-3">${item.topics.length} ta mavzu</span>
          <span class="font-weight-500 ml-3">${allLessonsNum} ta video</span>
        </a>
      </li>
		`)

		elModulesContainer.append(moduleHtml)
    i++
	}

	updateElWidth()
}

const createBuyingModules = (modules) => {
  elBuyingModulesContainer.html(``)
  if (!modules.length) return elBuyingModules.hide()
  elBuyingModules.show()

  let i = 1
  for (const item of modules) {
    const allLessonsNum = item.topics.reduce((acc, element) => acc + element.lessons.length, 0)
    const moduleHtml = $(`
      <li class="list-group-item d-flex flex-wrap justify-content-between align-items-center">
        <a class="text-decoration-none text-dark">
          ${item.type == "applicants" ? `
            <span class="font-weight-500 text-primary">A)</span>
          ` : `
            <span class="font-weight-500 text-success">B)</span>
          `}
          ${item.name} - <span class="font-weight-500">${item.price} so'm</span>
          <span class="font-weight-500 ml-3">${item.topics.length} ta mavzu</span>
          <span class="font-weight-500 ml-3">${allLessonsNum} ta video</span>
        </a>
        <div class="controls col-12 col-md-3 px-0 py-2 py-md-0 text-center text-md-right">
          <a href="${item.payUrl}" class="btn btn-sm btn-primary">Pulini to'lash</a>
        </div>
      </li>
    `)

    elBuyingModulesContainer.append(moduleHtml)
    i++
  }

  updateElWidth()
}

;(async () => {
	$(".loading-modal").modal('show')
  await checkAuthAsync(accessToken)
  const result = await $.ajax({
    type: 'GET',
    url: `${mainUrl}/api/v1/modules/my-modules`,
    headers: { "Authorization": accessToken },
  })

  console.log(result.data)
  modules = result.data
	createModules(modules.modules)
  createBuyingModules(modules.buyingModules)
	$(".loading-modal").modal('hide')
})()
