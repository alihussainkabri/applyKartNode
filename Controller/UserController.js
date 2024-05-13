async function deleteAccount(req,res){
    let status = 500
    let message = 'Oops something went wrong!'

    try {
        await knex('reels').where('created_by',req.params.user_id).then(async response => {
            if (response.length > 0){
                for (let i=0;i<response.length;i++){
                    await knex('reels').where('id', response[i].id).del().then(async response => {
                        if (response) {
                            await knex("post_impressions").where("post_id", response[i].id).where("created_by", req.params.user_id).del()
                        }
                    })
                }
            }
        })

        await knex("post_impressions").where("created_by", req.params.user_id).del()

        status = 200
        message = 'Account deleted successfully!'
    } catch (error) {
        status = 500
        message = error.message
    }
}

module.exports = {
    deleteAccount
}