/*
 * Copyright 2016 e-UCM (http://www.e-ucm.es/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * This project has received funding from the European Union’s Horizon
 * 2020 research and innovation programme under grant agreement No 644187.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0 (link is external)
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

var express = require('express'),
    authentication = require('../util/authentication'),
    async = require('async'),
    router = express.Router();

/**
 * @api {get} /roles Return the all roles.
 * @apiName GetRoles
 * @apiGroup Roles
 *
 * @apiPermission admin
 *
 * @apiSuccess(200) {String} Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      [
 *          "Role1",
 *          "Role2",
 *          "Role3"
 *      ]
 *
 */
router.get('/', authentication.authorized, function (req, res, next) {

    req.app.acl.listRoles(function (err, roles) {
        if (err) {
            return next(err);
        }

        res.json(roles);
    });
});

/**
 * @api {post} /roles Creates new roles.
 * @apiName PostRoles
 * @apiGroup Roles
 *
 * @apiParam {String} roles Role name.
 * @apiParam {Object[]} allows Object with resources and permissions.
 *
 * @apiPermission admin
 *
 * @apiParam {String} roles Role name.
 * @apiParam {String[]} resources Role resources.
 * @apiParam {String[]} permissions Resources permissions
 *
 * @apiParamExample {json} Request-Example:
 *      {
 *          "roles":"newRole",
 *          "allows":[
 *              {"resources":"resource-1", "permissions":["perm-1", "perm-3"]},
 *              {"resources":["resource-2","resource-3"], "permissions":["perm-1"]}
 *          ]
 *      }
 *
 * @apiParamExample {json} Request-Example:
 *      {
 *          "roles": "newRole",
 *          "resources": [
 *              "resource-1",
 *              "resource-2",
 *              "resource-3"
 *      ],
 *          "permissions": [
 *               "permission-1",
 *               "permission-2",
 *               "permission-3"
 *          ]
 *      }
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      [
 *          "Role1",
 *          "Role2",
 *          "newRole"
 *      ]
 *
 * @apiError(400) RolesRequired Roles required!.
 *
 * @apiError(400) RequiredResourcesAndPermissions Allows, or Resources and Permissions required!.
 *
 * @apiError(400) RoleExists The role {roleName} already exists.
 *
 */
router.post('/', authentication.authorized, function (req, res, next) {
    async.auto({
        validate: function (done) {
            var roleName = req.body.roles;
            var err;
            if (!roleName) {
                err = new Error('Roles required!');
                err.status = 400;
                return done(err);
            }

            if (!req.body.allows && (!req.body.resources || !req.body.permissions)) {
                err = new Error('Allows, or Resources and Permissions required!');
                err.status = 400;
                return done(err);
            }

            req.app.acl.listRoles(function (err, roles) {
                if (err) {
                    return done(err);
                }

                if (roles.indexOf(roleName) !== -1) {
                    err = new Error('The role ' + roleName + ' already exists.');
                    err.status = 400;
                    return done(err);
                }

                done();
            });
        },
        addRole: ['validate', function (done) {
            if (req.body.allows) {
                req.app.acl.allow([req.body], function (err, result) {
                    done(err, result);
                });
            } else {
                req.app.acl.allow(req.body.roles, req.body.resources, req.body.permissions, function (err, result) {
                    done(err, result);
                });
            }
            updateAppRoutes(req);
        }]
    }, function (err) {
        if (err) {
            return next(err);
        }
        req.app.acl.listRoles(function (err, roles) {
            if (err) {
                return next(err);
            }

            res.json(roles);
        });
    });
});

/**
 * @api {get} /roles/:roleName Returns the resources and permissions of role roleName
 * @apiName GetResources
 * @apiGroup Roles
 *
 * @apiParam {String} roleName Role name.
 *
 * @apiPermission admin
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *         "resources-1": [
 *              "permission-1"
 *              "permission-2",
 *              "permission-3"
 *         ],
 *         "resources-2": [
 *              "permission-3"
 *          ],
 *          "resources-3": [
 *              "permission-1",
 *              "permission-3"
 *          ],
 *      }
 *
 * @apiError(400) RoleExists The role {roleName}  doesn't exist.
 *
 */
router.get('/:roleName', authentication.authorized, function (req, res, next) {
    var roleName = req.params.roleName || '';

    async.auto({
        validate: function (done) {
            req.app.acl.existsRole(roleName, done);
        },
        get: ['validate', function (done) {
            req.app.acl.whatResources(roleName, function (err, result) {
                if (err) {
                    done(err);
                }

                done(null, result);
            });
        }]
    }, function (err, result) {
        if (err) {
            return next(err);
        }
        res.json(result.get);
    });

});

/**
 * @api {delete} /roles/:roleName Deletes the role with roleName.
 * @apiName DelRole
 * @apiGroup Roles
 *
 * @apiParam {String} roleName Role name.
 *
 * @apiPermission admin
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      [
 *          "Admin"
 *      ]
 *
 * @apiError(400) RolesRequired Roles required!.
 *
 * @apiError(400) RolesDoesNotExist The role doesn't exist.
 *
 * @apiError(400) RequiredResourcesAndPermissions Allows, or Resources and Permissions required!.
 *
 * @apiError(400) RoleExists The role {roleName} already exists.
 *
 */
router.delete('/:roleName', authentication.authorized, function (req, res, next) {
    var roleName = req.params.roleName || '';

    async.auto({
        validate: function (done) {
            if (roleName === 'admin') {
                var err = new Error('The role ' + roleName + ' is indestructible');
                err.status = 403;
                return done(err);
            }

            req.app.acl.existsRole(roleName, done);
        },
        delete: ['validate', function (done) {
            req.app.acl.removeRole(roleName, function (err) {
                if (err) {
                    return done(err);
                }
                done();
            });
        }]
    }, function (err) {
        if (err) {
            return next(err);
        }
        req.app.acl.listRoles(function (err, roles) {
            if (err) {
                return next(err);
            }
            res.json(roles);
        });
    });
});

/**
 * @api {post} /roles/:roleName/resources Creates new resource with permissions for a role.
 * @apiName PostResources
 * @apiGroup Roles
 *
 * @apiParam {Object[]} allows Object with resources and permissions.
 *
 * @apiPermission admin
 *
 * @apiParam {String[]} resources Role resources.
 * @apiParam {String[]} permissions Resources permissions
 *
 * @apiParamExample {json} Request-Example:
 *      {
 *          "allows":[
 *              {
 *                  "resources":"resource-1",
 *                  "permissions":[
 *                      "perm-1",
 *                      "perm-3"
 *                  ]
 *              },
 *              {
 *                  "resources":[
 *                      "resource-2",
 *                      "resource-3"
 *                  ],
 *                  "permissions":["perm-1"]
 *              }
 *          ]
 *      }
 *
 * @apiParamExample {json} Request-Example:
 *      {
 *          "resources": [
 *              "resource-1",
 *              "resource-2",
 *              "resource-3"
 *      ],
 *          "permissions": [
 *               "permission-1",
 *               "permission-2",
 *               "permission-3"
 *          ]
 *      }
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *         "resources-1": [
 *              "perm-1",
 *              "perm-3"
 *         ],
 *         "resources-2": [
 *              "perm-1"
 *          ],
 *          "resources-3": [
 *              "perm-1"
 *          ]
 *      }
 *
 * @apiError(400) RolesDoesNotExist The role doesn't exist.
 *
 * @apiError(400) RequiredResourcesAndPermissions Allows, or Resources and Permissions required!.
 *
 */
router.post('/:roleName/resources', authentication.authorized, function (req, res, next) {
    var roleName = req.params.roleName || '';

    async.auto({
        validate: function (done) {
            if (!req.body.allows && (!req.body.resources || !req.body.permissions)) {
                var error = new Error('Allows, or Resources and Permissions required!');
                error.status = 400;
                return done(error);
            }

            done();
        },
        checkRole: ['validate', function (done) {
            req.app.acl.existsRole(roleName, done);
        }],
        addResources: ['checkRole', function (done) {
            if (req.body.allows) {
                var role = req.body;
                role.roles = roleName;
                req.app.acl.allow([role], done);
            } else {
                req.app.acl.allow(roleName, req.body.resources, req.body.permissions, done);
            }
            updateAppRoutes(req);
        }]
    }, function (err) {
        if (err) {
            return next(err);
        }
        req.app.acl.whatResources(roleName, function (err, result) {
            if (err) {
                return next(err);
            }
            res.json(result);
        });
    });
});

/**
 * Given a role or object with resources/allows, this method added the new Routes to the correct application
 * (if the route starts by existing prefix and it doesn't contain the route yet).
 *
 * @param req
 */
function updateAppRoutes(req) {
    var resources = [];
    if (req.body.allows) {
        req.body.allows.forEach(function (obj) {
            resources = resources.concat(obj.resources);
        });
    } else {
        resources = req.body.resources;
    }

    var newAppRoutes = {};
    resources.forEach(function (resc) {
        if (resc[0] !== '/') {
            var appName = resc.split('/')[0];
            var app = newAppRoutes[appName] = newAppRoutes[appName] ? newAppRoutes[appName] : {};
            if (!app.routes) {
                app.routes = [];
            }
            app.routes.push(resc);
        }
    });
    var prefixes = Object.getOwnPropertyNames(newAppRoutes);
    var ApplicationModel = req.app.db.model('application');

    prefixes.forEach(function (prefix) {
        ApplicationModel.findOne({
            prefix: prefix
        }, 'routes', function (err, data) {
            if (err) {
                return;
            }
            if (data) {
                if (!data.routes) {
                    data.routes = [];
                }
                newAppRoutes[prefix].routes.forEach(function (r) {
                    if (data.routes.indexOf(r) === -1) {
                        data.routes.push(r);
                    }
                });

                data.save();
            }
        });
    });
}

/**
 * @api {post} /roles/:roleName/resources/:resourceName/permissions Creates new permissions.
 * @apiName PostPermissions
 * @apiGroup Roles
 *
 * @apiParam {String} roleName Role name.
 * @apiParam {String} resourceName Resource name.
 * @apiParam {String[]} permissions The new permissions.
 *
 * @apiPermission admin
 *
 * @apiParamExample {json} Request-Example:
 *      {
 *          "permission" : [
 *              "perm-1",
 *              "perm-3"
 *          ]
 *      }
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      [
 *          "permission",
 *          "perm-1",
 *          "perm-2"
 *      ]
 * @apiError(400) RolesDoesNotExist The role doesn't exist.
 *
 * @apiError(400) PermissionRequired Permissions required!.
 *
 * @apiError(400) ResourceDoesNotExist The resource in role doesn't exist.
 *
 */
router.post('/:roleName/resources/*/permissions', authentication.authorized, function (req, res, next) {
    var roleName = req.params.roleName || '';
    var resource = req.params[0] || '';

    async.auto({
        checkRole: function (done) {
            req.app.acl.existsRole(roleName, done);
        },
        validate: ['checkRole', function (done) {
            if (!req.body.permissions) {
                var err = new Error('Permissions required!');
                err.status = 400;
                return done(err);
            }

            req.app.acl.whatResources(roleName, function (err, result) {
                if (err) {
                    return done(err);
                }

                if (!result[resource]) {
                    err = new Error('The resource ' + resource + ' in ' + roleName + ' doesn\'t exist.');
                    err.status = 400;
                    return done(err);
                }

                return done();
            });
        }],
        addPermissions: ['validate', function (done) {
            req.app.acl.allow(roleName, resource, req.body.permissions, done);
        }]
    }, function (err) {
        if (err) {
            return next(err);
        }
        req.app.acl.whatResources(roleName, function (err, result) {
            if (err) {
                return next(err);
            }
            res.json(result[resource]);
        });
    });
});

/**
 * @api {delete} /roles/:roleName/resources/:resourceName/permissions/:permissionName Deletes a permission
 * @apiName DelPermission
 * @apiGroup Roles
 *
 * @apiParam {String} roleName Role name.
 * @apiParam {String} resourceName Resource name.
 * @apiParam {String} permissionName The permissions to delete.
 *
 * @apiPermission admin
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      [
 *          "permission-1",
 *          "permission-2",
 *          "permission-3"
 *      ]
 *
 * @apiError(400) RolesDoesNotExist The role doesn't exist.
 *
 * @apiError(400) PermissionDoesNotExist The permission of the resource doesn't exist.
 *
 * @apiError(400) ResourceDoesNotExist The resource in role doesn't exist.
 *
 * @apiError(403) LastPermission The permission can't be remove because is the last
 *
 */
router.delete('/:roleName/resources/*/permissions/:permissionName', authentication.authorized, function (req, res, next) {
    var roleName = req.params.roleName || '';
    var resource = req.params[0] || '';
    var permission = req.params.permissionName || '';

    async.auto({
        checkRole: function (done) {
            req.app.acl.existsRole(roleName, done);
        },
        validate: ['checkRole', function (done) {
            req.app.acl.whatResources(roleName, function (err, result) {
                if (err) {
                    return done(err);
                }
                if (!result[resource]) {
                    err = new Error('The resource ' + resource + ' in ' + roleName + ' doesn\'t exist.');
                    err.status = 400;
                    return done(err);
                }

                if (result[resource].length < 2) {
                    err = new Error('The permission ' + permission + ' can\'t be remove because is the last');
                    err.status = 400;
                    return done(err);
                }

                if (result[resource].indexOf(permission) === -1) {
                    err = new Error('The permission ' + permission + ' in the resource ' + resource + ' in ' + roleName + ' doesn\'t exist.');
                    err.status = 400;
                    return done(err);
                }
                done();
            });
        }],
        removePermissions: ['validate', function (done) {
            req.app.acl.removeAllow(roleName, resource, permission, function (err) {
                if (err) {
                    return done(err);
                }
                done();
            });
        }]
    }, function (err) {
        if (err) {
            return next(err);
        }
        req.app.acl.whatResources(roleName, function (err, result) {
            if (err) {
                return next(err);
            }
            res.send(result[resource] || []);
        });
    });
});


/**
 * @api {delete} /roles/:roleName/resources/:resourceName Deletes the resource with resourceName in roleName role
 * @apiName DelResource
 * @apiGroup Roles
 *
 * @apiParam {String} roleName Role name.
 * @apiParam {String} resourceName Resource to delete.
 *
 * @apiPermission admin
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *         "resources-1": [
 *              "perm-1"
 *              "perm-3"
 *         ]
 *      }
 *
 * @apiError(400) RolesDoesNotExist The role doesn't exist.
 *
 * @apiError(400) ResourceDoesNotExist The resource in the role doesn't exist.
 *
 */
router.delete('/:roleName/resources/*', authentication.authorized, function (req, res, next) {
    var roleName = req.params.roleName || '';
    var resource = req.params[0] || '';

    async.auto({
        validate: function (done) {
            req.app.acl.existsRole(roleName, function (err) {
                if (err) {
                    return done(err);
                }

                req.app.acl.whatResources(roleName, function (err, result) {
                    if (err) {
                        return next(err);
                    }

                    if (!result[resource]) {
                        err = new Error('The resource ' + resource + ' in ' + roleName + ' doesn\'t exist.');
                        err.status = 400;
                        return done(err);
                    }

                    done(null, result[resource]);
                });
            });
        },
        deleteResources: ['validate', function (done, results) {
            req.app.acl.removeAllow(roleName, resource, results.validate, done);
        }]
    }, function (err) {
        if (err) {
            return next(err);
        }
        req.app.acl.whatResources(roleName, function (err, result) {
            if (err) {
                return next(err);
            }
            res.json(result);
        });
    });
});

/**
 * @api {get} /roles/:roleName/resources/:resourceName Returns the permissions of resource resourceName in role roleName.
 * @apiName GetResources
 * @apiGroup Roles
 *
 * @apiParam {String} roleName Role name.
 * @apiParam {String} resourceName Resource name.
 *
 * @apiPermission admin
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      [
 *          "permission1",
 *          "permission2",
 *          "permission3"
 *      ]
 *
 * @apiError(400) RolesDoesNotExist The role doesn't exist.
 *
 * @apiError(400) ResourceDoesNotExist The resource in role doesn't exist.
 *
 */
router.get('/:roleName/resources/*', authentication.authorized, function (req, res, next) {
    var roleName = req.params.roleName || '';
    var resource = req.params[0] || '';

    req.app.acl.existsRole(roleName, function (err) {
        if (err) {
            return next(err);
        }

        req.app.acl.whatResources(roleName, function (err, result) {
            if (err) {
                return next(err);
            }

            if (!result[resource]) {
                err = new Error('The resource ' + resource + ' in ' + roleName + ' doesn\'t exist.');
                err.status = 400;
                return next(err);
            }

            res.json(result[resource]);
        });
    });
});

/**
 * @api {get} /roles/:roleName/users Return the username of user with the role.
 * @apiName GetRoleUsers
 * @apiGroup Roles
 *
 * @apiParam {String} roles Role name.
 *
 * @apiPermission admin
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      [
 *          "user1",
 *          "user2",
 *          "user3"
 *      ]
 *
 * @apiError(400) RolesDoesNotExist The role doesn't exist.
 *
 */
router.get('/:roleName/users', authentication.authorized, function (req, res, next) {
    var roleName = req.params.roleName || '';

    req.app.acl.existsRole(roleName, function (err) {
        if (err) {
            return next(err);
        }

        req.app.acl.roleUsers(roleName, function (err, users) {
            if (err) {
                return next(err);
            }

            res.json(users);
        });
    });
});


module.exports = router;