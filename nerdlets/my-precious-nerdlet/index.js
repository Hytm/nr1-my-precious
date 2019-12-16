import React from 'react'
import copy from 'copy-to-clipboard'
import { Grid, GridItem, Card, CardHeader, CardBody, Spinner, Button, Toast, HeadingText } from 'nr1'
import axios from 'axios'

// https://docs.newrelic.com/docs/new-relic-programmable-platform-introduction

export default class MyPreciousNerdlet extends React.Component {


    constructor(props) {
        super(props)

        this.state = {
            repositories: [],
            repos: 'https://api.github.com/repos/:owner/:repo/readme?access_token={your_access_token}',
            seeMore: 'https://github.com/search?q=filename%3Anr1.json&type=Code&sort=stars',
            loading: true,
            ts: `git clone https://github.com/$1/$2.git
cd $2

nr1 nerdpack:uuid -gf
npm install
nr1 nerdpack:publish
nr1 nerdpack:deploy -c STABLE
nr1 nerdpack:subscribe -c STABLE

cd ..
rm -rf $2`
        }
    }

    async componentDidMount() {
        var total = 0
        var perPage = 0
        var uri = 'https://api.github.com/search/code?q=%22schemaType%22:%20%22NERDLET%22&in:file&access_token={your_access_token}&page='
        var res = await axios.get(uri + 0)
        var r = res.data.items
        total = res.data.total_count
        perPage = res.data.items.length
        var maxPage = Math.ceil(total / perPage)
        for (let p = 1; p <= maxPage; p++) {
            res = await axios.get(uri + p)
            r = r.concat(res.data.items)
        }
        var repos = []
        var viewed = []
        for (let i = 0; i < r.length; i++) {
            const e = r[i];
            var search = e.repository.name + ':' + e.repository.owner.login
            if (viewed.indexOf(search) <= 0) {
                repos.push(e)
                viewed.push(search)
            }
        }
        this.setState({ repositories: repos })
        console.log(this.state.repositories.length)
        this.setState({ loading: false })
    }


    _buildStack() {
        let repos = []
        for (let i = 0; i < this.state.repositories.length; i++) {
            const r = this.state.repositories[i]

            const sub = 'by ' + r.repository.owner.login
            repos.push(
                <GridItem columnSpan={3}>
                    <Card>
                        <CardHeader title={r.repository.name} subtitle={sub} />
                        <CardBody>
                            {r.description == null ? 'No description' : r.description}
                            <br />
                            <Button
                                onClick={() => window.open(r.repository.html_url, "_blank")}
                                type={Button.TYPE.PRIMARY}
                                spacingType={[Button.SPACING_TYPE.MEDIUM]}
                            >See on Github</Button>
                            <Button
                                onClick={() => this._copyToClipboard(r.repository.owner.login, r.repository.name)}
                                type={Button.TYPE.NORMAL}
                                iconType={Button.ICON_TYPE.DOCUMENTS__DOCUMENTS__FILE__A_ADD}
                            >Copy deployment script to clipboard</Button>
                        </CardBody>
                    </Card>
                </GridItem>
            )
        }
        return repos
    }

    _copyToClipboard(owner, name) {
        var script = this._getScript(owner, name)
        copy(script)
        Toast.showToast({
            title: 'Script copied',
            description: 'Your script to deploy ' + name + ' has been copied to the clipboard',
            type: Toast.TYPE.NORMAL
        })
    }

    _getScript(owner, name) {
        return this.state.ts.replace('$1', owner).replace('$2', name).replace('$2', name).replace('$2', name)
    }

    render() {
        var mainDiv
        if (this.state.loading) {
            mainDiv = <Spinner fillContainer />
        } else {
            mainDiv = this._buildStack()
        }
        return (
            <div>
                <HeadingText spacingType={[HeadingText.SPACING_TYPE.MEDIUM]}>
                    We check the public repositories from Github on a specific file content ("schemaType": "NERDLET") to show all publicly available Nerdlets
                </HeadingText>
                <Grid>
                    {mainDiv}
                </Grid>
            </div>
        )
    }
}
