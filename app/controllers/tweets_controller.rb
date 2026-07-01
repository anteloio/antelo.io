class TweetsController < ApplicationController
  before_action :require_user, only: :toggle_sent

  def index
    @tweets = Tweet.for_queue_page
    @queued_count = Tweet.queued.count
  end

  def toggle_sent
    Tweet.find(params[:id]).mark_sent!(params[:sent].present?)
    redirect_to tweets_path
  end
end
