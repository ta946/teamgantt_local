# TeamGantt Local

### NOTE REGARDING COMMENTS
Comments are naively identified by count.

If 1 comment is deleted and 1 new comment is added, it will not detect a change in comments!

Also it cannot detect modifications to comments as that does not change the number of comments.

To "refresh" all the comments, delete `data.js` then run `run_teamgantt` again.


## Setup

1. Create copy of `creds_example.py` and rename to `creds.py`
1. Open `creds.py` and enter your teamgantt `email` & `pass`
1. Create api keys:
	1. Login to teamgantt
	1. Click your profile in top right
	1. Click on **Integrations**
	1. Find **REST API** and click **CONFIGURE**
	1. Under **Client Name** enter any name like `local_webapp` and click save
	1. Copy `Client Id` and enter it in `creds.py`
	1. Copy `Client Secret` and enter it in `creds.py`
1. Find user id:
	1. Login to teamgantt
	1. Open devtools and go to **Application** tab
	1. Click **Cookies**
	1. Click **https://app.teamgantt.com**
	1. Filter/search for `user_id` (might be called ajs_user_id)
	1. Copy `user_id` and enter it in `creds.py`


## Limiting projects to download

#### By default, all teamgantt projects will be checked for updates and downloaded.
#### If you only care about specific projects, you can limit which ones to check, which will be faster.

1. Open `run_teamgantt.py`
1. At the end of the file, under `def main(projects_map=None):` add the following with the correct indentation (4 spaces):
```python
projects_map = {
    <PROJECT_ID>: "<PROJECT_NAME>",
}
```
1. Login to teamgantt
1. You should be in **https://app.teamgantt.com/my-projects/** if not, click the top right teamgantt icon
1. To add projects to `projects_map`:
	1. Right-click a project you want to include
	1. Click **Copy link address** and paste it in notepad or any text editor, it will look like https://app.teamgantt.com/projects?ids=*1234567*
	1. Copy the project id `1234567` at the end of the link
	1. In `run_teamgantt.py`, in `projects_map` that you added earlier, replace `<PROJECT_ID>` with the project id
	1. Go back to teamgantt and copy the name of the project. e.g.: `My Teamgantt Project`
	1. In `run_teamgantt.py`, in `projects_map` that you added earlier, replace `<PROJECT_NAME>` with the project name
	1. Repeat for every project you want to include
1. The final result should look like:
```python
def main(projects_map=None):
    projects_map = {
        1234567: "My Teamgantt Project",
        7654321: "Project That Will Never Finish",
    }
    teamgantt = TeamGantt()
```
1. To remove the project limiting, you can either delete projects_map, comment it out, or set projects_map to None