# A handle its user has since changed: it redirects to their current one and stays theirs.
class UserHandle < ActiveRecord::Base
  belongs_to :user
end
