// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title DemoRegistry
 * @notice Permissive demo contract for hackathon - NO ACCESS CONTROL
 * @dev Anyone can register for demo purposes
 */
contract DemoRegistry {
    
    event DrugRegistered(bytes32 indexed batchHash, address indexed issuer, uint256 timestamp);
    event ShortageAlert(bytes32 indexed predictionHash, string drugName, uint256 probability);
    
    struct DrugBatch {
        bytes32 batchHash;
        address issuer;
        uint256 timestamp;
        bool exists;
    }
    
    mapping(bytes32 => DrugBatch) public batches;
    uint256 public totalBatches;
    
    function registerDrugBatch(bytes32 _batchHash) external {
        require(_batchHash != bytes32(0), "Invalid hash");
        require(!batches[_batchHash].exists, "Already registered");
        
        batches[_batchHash] = DrugBatch({
            batchHash: _batchHash,
            issuer: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });
        
        totalBatches++;
        emit DrugRegistered(_batchHash, msg.sender, block.timestamp);
    }
    
    function recordShortage(bytes32 _hash, string calldata _drug, uint256 _prob) external {
        emit ShortageAlert(_hash, _drug, _prob);
    }
    
    function verifyBatch(bytes32 _hash) external view returns (bool, DrugBatch memory) {
        return (batches[_hash].exists, batches[_hash]);
    }
}
