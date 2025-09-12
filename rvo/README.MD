# RVO库

用例：

```javascript
//实例化
this._simulator = Simulator.instance;
//添加agent
this._simulator.addAgent({ x, y }, {...agentProperties});

//根据目标位置更新每个agent的Velocity
setPreferredVelocities() {
    let agentCnt = this._simulator.getNumAgents();
    const goal = this.goal();
    for (let i = 0; i < agentCnt; i++) {
        const agent = this._simulator.getAgent(i);
        let goalVector = goal.minus(this._simulator.getAgentPosition(agent.id));
        if (RVOMath.absSq(goalVector) > 1.0) {
            goalVector = RVOMath.normalize(goalVector).scale(agent.maxSpeed_);
        }
        if (RVOMath.absSq(goalVector) < RVOMath.RVO_EPSILON) {
            // Agent is within one radius of its goal, set preferred velocity to zero
            this._simulator.setAgentPrefVelocity(agent.id, new Vector2(0.0, 0.0));
        }
        else {
            let angle = Math.random() *2.0* Math.PI;
            let dist = Math.random() * 0.0001;
            this._simulator.setAgentPrefVelocity(agent.id, goalVector.plus(new Vector2(Math.cos(angle), Math.sin(angle)).scale(dist)));
        }
    }
}
//每帧执行
update(dt) {
    this.setPreferredVelocities();
    this._simulator.run(dt);
    //其他逻辑
}
```
