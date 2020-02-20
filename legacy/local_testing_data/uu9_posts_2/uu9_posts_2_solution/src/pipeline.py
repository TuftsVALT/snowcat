import pandas

import os.path

from d3m import container, metrics

here = os.path.dirname(os.path.abspath(__file__))

test_dataset_path = os.path.join(here, '..', '..', 'TEST/dataset_TEST/datasetDoc.json')
score_dataset_path = os.path.join(here, '..', '..', 'SCORE/dataset_SCORE/datasetDoc.json')
solution_path = os.path.join(here, '..')

assert os.path.exists(test_dataset_path)

if __name__ == '__main__':
    test_dataset = container.Dataset.load('file://' + test_dataset_path)

    post_ids = test_dataset['learningData'].loc[:, 'post_id']
    comments = test_dataset['comments']

    comments_count = [(comments.loc[:, 'post_id'] == post_id).sum() for post_id in post_ids]

    predictions = test_dataset['learningData'].drop('post_id', axis=1)
    predictions.loc[:, 'comments_count'] = comments_count

    score_dataset = container.Dataset.load('file://' + score_dataset_path)

    truth = score_dataset['learningData'].drop('post_id', axis=1)

    score = metrics.RootMeanSquareErrorMetric().score(truth, predictions)
    print('RMSE score on test data:', score)

    # saving the predictions.csv file
    predictions.to_csv(os.path.join(solution_path, 'predictions.csv'), index=False)

    # saving the scores.csv file
    scores = pandas.DataFrame(columns=['metric', 'value'])
    scores.loc[len(scores)] = ['ROOT_MEAN_SQUARED_ERROR', score]
    scores.to_csv(os.path.join(solution_path, 'scores.csv'), index=False)
