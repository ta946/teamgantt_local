import base64
import concurrent.futures
import datetime
import json
import os
import threading
from itertools import repeat

from oauthlib.oauth2 import LegacyApplicationClient, TokenExpiredError
from requests_oauthlib import OAuth2Session

from creds import (CLIENT_ID, CLIENT_SECRET, EMAIL, PASS, TEAMGANTT_API_URL,
                   TEAMGANTT_TOKEN_URL, USER_ID)

TOKEN_FILE_PATH = "teamgantt_token.py"
DATA_FILE_PATH = "data.js"


def datetime_to_datetime_text(datetime_obj, strftime='%Y-%m-%d-%H-%M-%S'):
    datetime_text = datetime_obj.strftime(strftime)
    return datetime_text


class TeamGantt:
    def __init__(self):
        self._token = None
        self._client_dict = {
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET,
        }
        self._user_id = USER_ID
        self.projects_map = {}
        self.data = {
            'created': None,
            'projects_map': {},
            'projects': {},
        }
        self._data_prev = {}
        self._event_fetch_token_done = threading.Event()
        self._event_fetch_token_done.set()
        self._request_threads = 20

    # def _read_token_json(self):
    #     if not os.path.exists(TOKEN_FILE_PATH):
    #         return False
    #     with open(TOKEN_FILE_PATH, 'r') as f:
    #         self._token = json.load(f)
    #     return True

    # def _save_token_json(self):
    #     if self._token is None:
    #         raise ValueError('Cannot save token json! token dict is None!')
    #     with open(TOKEN_FILE_PATH, 'w') as f:
    #         json.dump(self._token, f)

    def _read_token(self):
        if not os.path.exists(TOKEN_FILE_PATH):
            return False
        from teamgantt_token import TOKEN
        self._token = TOKEN
        return True

    def _save_token(self):
        if self._token is None:
            raise ValueError('Cannot save token! token dict is None!')
        text = f'TOKEN = {json.dumps(self._token)}\n'
        with open(TOKEN_FILE_PATH, 'w') as f:
            f.write(text)

    def _update_token(self, token):
        self._token = token
        self._save_token()

    def _fetch_new_token(self):
        client = LegacyApplicationClient(client_id=CLIENT_ID)
        oauth = OAuth2Session(client=client)
        auth_header = f'{CLIENT_ID}:{CLIENT_SECRET}'
        encoded_auth_header = base64.b64encode(auth_header.encode("utf-8"))
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": f"Basic {encoded_auth_header}"
        }
        token = oauth.fetch_token(
            token_url=TEAMGANTT_TOKEN_URL,
            client_id=CLIENT_ID,
            client_secret=CLIENT_SECRET,
            headers=headers,
            username=EMAIL,
            password=PASS,
        )
        self._update_token(token)

    def _authenticate(self, force=False):
        if not force:
            if self._token is not None:
                return
            ret = self._read_token()
            if ret:
                return
        self._fetch_new_token()

    def _create_0auth_client(self):
        # client = OAuth2Session(CLIENT_ID, token=self._token, auto_refresh_url=TEAMGANTT_TOKEN_URL,
        #                        auto_refresh_kwargs=self._client_dict, token_updater=self._update_token)
        client = OAuth2Session(CLIENT_ID, token=self._token)
        return client

    def _request(self, method, *args, **kwargs):
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": f"Bearer {self._token['access_token']}"
        }
        client = self._create_0auth_client()
        fn = getattr(client, method)
        try:
            res = fn(*args, headers=headers, **kwargs)
        except TokenExpiredError:
            if not self._event_fetch_token_done.is_set():
                self._event_fetch_token_done.wait()
            else:
                self._event_fetch_token_done.clear()
                self._fetch_new_token()
                self._event_fetch_token_done.set()
            client = self._create_0auth_client()
            fn = getattr(client, method)
            res = fn(*args, headers=headers, **kwargs)
        return res

    @staticmethod
    def _add_param(params, name, value):
        if value is None:
            return
        if type(value) is list:
            value = ','.join(list(map(str,value)))
        elif type(value) is bool:
            value = str(value).lower()
        params[name] = value

    @staticmethod
    def _item_type_to_target_type(item_type):
        if item_type == 'project':
            target_type = 'projects'
        elif item_type in ('group','subgroup'):
            target_type = 'groups'
        elif item_type == 'task':
            target_type = 'tasks'
        else:
            raise ValueError('Invalid item_type')
        return target_type

    def _fetch_csv(self, project_ids):
        url = f'{TEAMGANTT_API_URL}projects/export/csv'
        params = {}
        self._add_param(params, 'ids', project_ids)
        res = self._request('post', url, params=params)
        res_json = res.json()
        print(json.dumps(res_json))

    def _fetch_projects(self):
        url = f'{TEAMGANTT_API_URL}projects'
        res = self._request('get', url)
        projects_dict = res.json()
        print('projects_dict')
        print(projects_dict)
        return projects_dict

    def _fetch_project_children(self, project_id, flatten=None):
        url = f'{TEAMGANTT_API_URL}projects/{project_id}/children'
        params = {}
        self._add_param(params, 'is_flat_list', flatten)
        res = self._request('get', url, params=params)
        project_children = res.json()
        print('project_children')
        print(project_children)
        return project_children

    def _fetch_groups(self, project_ids=None, flatten=None):
        url = f'{TEAMGANTT_API_URL}groups'
        params = {}
        self._add_param(params, 'project_ids', project_ids)
        self._add_param(params, 'flatten_children', flatten)
        res = self._request('get', url, params=params)
        res_json = res.json()
        print(json.dumps(res_json))
        return res_json

    def _fetch_tasks(self, project_ids=None, start_date=None, end_date=None, user_only=False, hide_complete=None):
        url = f'{TEAMGANTT_API_URL}tasks'
        params = {}
        self._add_param(params, 'project_ids', project_ids)
        self._add_param(params, 'start_date', start_date)
        self._add_param(params, 'end_date', end_date)
        if user_only:
            self._add_param(params, 'user_resource_ids', self._user_id)
        self._add_param(params, 'hide_complete', hide_complete)
        res = self._request('get', url, params=params)
        res_json = res.json()
        print(json.dumps(res_json))
        return res_json

    def _fetch_task(self, task_id):
        url = f'{TEAMGANTT_API_URL}tasks/{task_id}'
        params = {}
        res = self._request('get', url, params=params)
        res_json = res.json()
        print(json.dumps(res_json))
        return res_json

    def _fetch_comment(self, target_type, item_id):
        assert target_type in ('projects','groups','tasks')
        url = f'{TEAMGANTT_API_URL}{target_type}/{item_id}/comments'
        params = {}
        res = self._request('get', url, params=params)
        res_json = res.json()
        comments = {comment['id']: comment for comment in res_json}
        print('comments', item_id)
        print(json.dumps(comments))
        return comments

    def _fetch_item_comments(self, project, item_id):
        item = project['items'][item_id]
        item_type = item['type']
        target_type = self._item_type_to_target_type(item_type)
        comments = self._fetch_comment(target_type, item_id)
        return comments

    def _fetch_comments_threaded(self, project, item_id_list):
        with concurrent.futures.ThreadPoolExecutor(max_workers=self._request_threads) as executor:
            comments_list = executor.map(self._fetch_item_comments, repeat(project), item_id_list)
            for item_id, comments in zip(item_id_list, comments_list):
                project['items'][item_id]['comments'] = comments
                for comment_id in comments:
                    project['comments'][comment_id] = item_id

    def _mark_all_comments_read(self):
        url = f'{TEAMGANTT_API_URL}discussions/mark_all_as_read'
        params = {}
        res = self._request('patch', url, params=params)
        res_json = res.json()
        print(json.dumps(res_json))
        return res_json

    def _setup_wbs(self, project):
        for item in project['items'].values():
            item_type = item['type']
            if item_type == 'task':
                wbs = item['wbs']
            else:
                wbs_list = [str(project['items'][group_id]['sort']) for group_id in item['ancestor_group_ids']]
                wbs_list.append(str(item['sort']))
                wbs = '.'.join(wbs_list)
                item['wbs'] = wbs
            project['wbs'][wbs] = item['id']

    def _parse_project_children(self, project_children):
        project = {
            'groups': [],
            'subgroups': [],
            'tasks': [],
            'items_with_comments': [],
            'items_with_unread_comments': [],
            'items_with_comments_to_fetch': [],
            'new_items': [],
            'comments': {},
            'wbs': {},
            'items': {},
        }
        for item in project_children:
            item_type = item['type']
            if item_type == 'milestone':
                continue
            item_id = item['id']
            has_comments = bool(item['comment_info']['count'])
            item['comments'] = {}
            project['items'][item_id] = item
            project[f'{item_type}s'].append(item_id)
            if has_comments:
                project['items_with_comments'].append(item_id)
                has_unread_comments = bool(item['comment_info']['count'])
                if has_unread_comments:
                    project['items_with_unread_comments'].append(item_id)
        self._setup_wbs(project)
        return project

    def _compare_projects(self, project, project_prev):
        item_id_list = []
        items_with_comments = project['items_with_comments']
        items_with_comments_prev = project_prev.get('items_with_comments',[])
        items_with_comments_set = set(items_with_comments)
        items_with_comments_prev_set = set(items_with_comments_prev)
        item_id_list_diff = list(items_with_comments_set - items_with_comments_prev_set)
        item_id_list.extend(item_id_list_diff)

        item_id_list_intersect = list(items_with_comments_set & items_with_comments_prev_set)
        for item_id in item_id_list_intersect:
            count = project['items'][item_id]['comment_info']['count']
            count_prev = project_prev['items'][item_id]['comment_info']['count']
            if count != count_prev:
                item_id_list.append(item_id)

        if project_prev:
            new_items = list(set(project['items']) - set(project_prev['items']))
            if not len(new_items):
                new_items = project_prev['new_items']
            project['new_items'] = new_items

            project['comments'] = project_prev['comments'].copy()
            for comment_id, item_id in project_prev['comments'].items():
                if item_id not in project['items']:
                    continue
                project['items'][item_id]['comments'] = project_prev['items'][item_id]['comments']
        return item_id_list

    def _load(self):
        if not os.path.exists(DATA_FILE_PATH):
            return {}
        with open(DATA_FILE_PATH,'r') as f:
            text = f.read()
        text = text.strip('DATA = ')
        data = json.loads(text)
        projects = list(data['projects'])
        for project_id_str in projects:
            project = data['projects'][project_id_str]
            items = list(project['items'])
            for item_str in items:
                project['items'][int(item_str)] = project['items'][item_str]
                del project['items'][item_str]
            data['projects'][int(project_id_str)] = data['projects'][project_id_str]
            del data['projects'][project_id_str]
        return data

    def _save(self):
        text = f'DATA = {json.dumps(self.data)}'
        with open(DATA_FILE_PATH,'w') as f:
            f.write(text)

    def run(self, projects_map=None):
        self.projects_map = projects_map
        if not self.projects_map:
            projects_dict = self._fetch_projects()
            self.projects_map = {item['id']: item['name'] for item in projects_dict['projects']}
        dt_created = datetime.datetime.now()
        datetime_text = datetime_to_datetime_text(dt_created)
        self.data['created'] = datetime_text
        self.data['projects_map'] = self.projects_map
        self._data_prev = self._load()
        self._authenticate()
        for project_id in self.projects_map:
            # with open('data/project_children_flat.json','r') as f:
            #     project_children = json.load(f)
            project_children = self._fetch_project_children(project_id, flatten=True)
            project = self._parse_project_children(project_children)
            project_prev = self._data_prev.get('projects',{}).get(project_id,{})
            item_id_list = self._compare_projects(project, project_prev)
            self._fetch_comments_threaded(project, item_id_list)
            self.data['projects'][project_id] = project
        self._save()
        return self.data


def main(projects_map=None):
    projects_map = {
        3522589: 'Dead-time Removal & Rally Detection',
        3524903: 'MPM - Improvement after Beta',
    }
    teamgantt = TeamGantt()
    teamgantt.run(projects_map=projects_map)
    os.startfile('teamgantt.html')


if __name__ == '__main__':
    main()
