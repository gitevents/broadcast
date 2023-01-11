import core from '@actions/core'

export default async function resolveLinks(octokit, formBody) {
  core.info('Resolving agenda links...')
  const agenda = []

  if (formBody && formBody.agenda) {
    for (const item of formBody.agenda.list) {
      if (item.link) {
        const link = item.link
        const linkSplit = link.split('/')
        const owner = linkSplit[3]
        const repo = linkSplit[4]
        const issueNumber = linkSplit[6]
        const { data: issue } = await octokit.rest.issues.get({
          owner: owner,
          repo: repo,
          issue_number: issueNumber
        })
        console.log(issue)
        agenda.push({
          title: issue.title,
          body: issue.body,
          author: {
            login: issue.user.login,
            avatar_url: issue.user.avatar_url
          }
        })
      }
    }
  }

  return agenda
}
